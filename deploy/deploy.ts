import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { Buffer } from 'node:buffer';
import * as Rx from 'rxjs';
import pino from 'pino';
import { WebSocket } from 'ws';
import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english.js';
import * as ledger from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  HDWallet,
  Roles,
  WalletFacade,
  ShieldedWallet,
  DustWallet,
  UnshieldedWallet,
  createKeystore,
  InMemoryTransactionHistoryStorage,
  WalletEntrySchema,
  PublicKey as UnshieldedPublicKey,
} from '@midnight-ntwrk/wallet-sdk';
import { Contract } from '../contract/src/managed/aegis/contract/index.js';
import { witnesses, initialPrivateState } from './witnesses.js';

// @ts-ignore
globalThis.WebSocket = WebSocket;

const logger = pino({ level: 'info' });
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV_PATH = path.join(ROOT, '.env');
const ZK_CONFIG_PATH = path.join(ROOT, 'contract/src/managed/aegis');

const config = {
  networkId: 'preprod',
  indexer: 'https://indexer.preprod.midnight.network/api/v4/graphql',
  indexerWS: 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
  node: 'wss://rpc.preprod.midnight.network',
  proofServer: 'http://127.0.0.1:6300',
};

// ---------- env helpers (secrets never printed) ----------
const appendEnv = (key: string, value: string) => {
  fs.appendFileSync(ENV_PATH, `\n${key}="${value}"\n`);
  fs.chmodSync(ENV_PATH, 0o600);
  process.env[key] = value;
};

// ---------- wallet ----------
interface WalletContext {
  wallet: WalletFacade;
  shieldedSecretKeys: ledger.ZswapSecretKeys;
  dustSecretKey: ledger.DustSecretKey;
  unshieldedKeystore: any;
}

const initWalletWithSeed = async (seed: Buffer): Promise<WalletContext> => {
  const hdWallet = HDWallet.fromSeed(seed);
  if (hdWallet.type !== 'seedOk') throw new Error('Failed to initialize HDWallet');

  const derivation = hdWallet.hdWallet
    .selectAccount(0)
    .selectRoles([Roles.Zswap, Roles.NightExternal, Roles.Dust])
    .deriveKeysAt(0);
  if (derivation.type !== 'keysDerived') throw new Error('Failed to derive keys');
  hdWallet.hdWallet.clear();

  const shieldedSecretKeys = ledger.ZswapSecretKeys.fromSeed(derivation.keys[Roles.Zswap]);
  const dustSecretKey = ledger.DustSecretKey.fromSeed(derivation.keys[Roles.Dust]);
  const unshieldedKeystore = createKeystore(derivation.keys[Roles.NightExternal], config.networkId as any);

  const relayURL = new URL(config.node.replace(/^http/, 'ws'));
  const conn = { indexerHttpUrl: config.indexer, indexerWsUrl: config.indexerWS };

  const shieldedConfig = {
    networkId: config.networkId,
    indexerClientConnection: conn,
    provingServerUrl: new URL(config.proofServer),
    relayURL,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema),
  };
  const unshieldedConfig = {
    networkId: config.networkId,
    indexerClientConnection: conn,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema),
  };
  const dustConfig = {
    networkId: config.networkId,
    costParameters: { additionalFeeOverhead: 300_000_000_000_000n, feeBlocksMargin: 5 },
    indexerClientConnection: conn,
    provingServerUrl: new URL(config.proofServer),
    relayURL,
    txHistoryStorage: new InMemoryTransactionHistoryStorage(WalletEntrySchema),
  };
  const unifiedConfig = { ...shieldedConfig, ...unshieldedConfig, ...dustConfig };

  const facade = await WalletFacade.init({
    configuration: unifiedConfig,
    shielded: () => ShieldedWallet(shieldedConfig).startWithSecretKeys(shieldedSecretKeys),
    unshielded: () =>
      UnshieldedWallet(unshieldedConfig).startWithPublicKey(UnshieldedPublicKey.fromKeyStore(unshieldedKeystore)),
    dust: () => DustWallet(dustConfig).startWithSecretKey(dustSecretKey, ledger.LedgerParameters.initialParameters().dust),
  } as any);
  await facade.start(shieldedSecretKeys, dustSecretKey);

  return { wallet: facade, shieldedSecretKeys, dustSecretKey, unshieldedKeystore };
};

const waitForSync = (wallet: WalletFacade) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((s: any) => logger.info(`Waiting for wallet sync. Synced: ${s.isSynced}`)),
      Rx.filter((s: any) => s.isSynced),
    ),
  );

const waitForFunds = (wallet: WalletFacade) =>
  Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.throttleTime(10_000),
      Rx.tap((s: any) => {
        const night = s.unshielded?.balances[ledger.nativeToken().raw] ?? 0n;
        logger.info(`Waiting for NIGHT funds. Synced: ${s.isSynced}, NIGHT: ${night}`);
      }),
      Rx.filter((s: any) => s.isSynced),
      Rx.map((s: any) => s.unshielded?.balances[ledger.nativeToken().raw] ?? 0n),
      Rx.filter((b: bigint) => b > 0n),
    ),
  );

const registerNightForDust = async (ctx: WalletContext): Promise<boolean> => {
  const state: any = await Rx.firstValueFrom(ctx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)));
  const unregistered =
    state.unshielded?.availableCoins.filter((c: any) => c.meta.registeredForDustGeneration === false) ?? [];

  if (unregistered.length === 0) {
    const dust = state.dust?.balance(new Date()) ?? 0n;
    logger.info(`No unregistered NIGHT UTXOs. Current DUST: ${dust}`);
    return dust > 0n;
  }

  logger.info(`Registering ${unregistered.length} NIGHT UTXO(s) for DUST generation...`);
  const recipe = await ctx.wallet.registerNightUtxosForDustGeneration(
    unregistered,
    ctx.unshieldedKeystore.getPublicKey(),
    (payload: any) => ctx.unshieldedKeystore.signData(payload),
  );
  const finalized = await ctx.wallet.finalizeRecipe(recipe);
  const txId = await ctx.wallet.submitTransaction(finalized);
  logger.info(`Dust registration submitted: ${txId}`);

  await Rx.firstValueFrom(
    ctx.wallet.state().pipe(
      Rx.throttleTime(5_000),
      Rx.tap((s: any) => logger.info(`DUST balance: ${s.dust?.balance(new Date()) ?? 0n}`)),
      Rx.filter((s: any) => (s.dust?.balance(new Date()) ?? 0n) > 0n),
    ),
  );
  logger.info('DUST is available.');
  return true;
};

const createWalletAndMidnightProvider = async (ctx: WalletContext): Promise<any> => {
  await Rx.firstValueFrom(ctx.wallet.state().pipe(Rx.filter((s: any) => s.isSynced)));
  return {
    getCoinPublicKey: () => ctx.shieldedSecretKeys.coinPublicKey,
    getEncryptionPublicKey: () => ctx.shieldedSecretKeys.encryptionPublicKey,
    async balanceTx(tx: any, ttl?: Date) {
      const txTtl = ttl ?? new Date(Date.now() + 30 * 60 * 1000);
      const recipe = await ctx.wallet.balanceUnboundTransaction(
        tx,
        { shieldedSecretKeys: ctx.shieldedSecretKeys, dustSecretKey: ctx.dustSecretKey },
        { ttl: txTtl },
      );
      return await ctx.wallet.finalizeRecipe(recipe);
    },
    async submitTx(tx: any) {
      return await ctx.wallet.submitTransaction(tx);
    },
  };
};

// ---------- main ----------
async function main() {
  setNetworkId(config.networkId);

  // 1. Wallet mnemonic (created once, stored only in .env, never printed)
  let mnemonic = process.env.AEGIS_WALLET_MNEMONIC;
  if (!mnemonic) {
    mnemonic = bip39.generateMnemonic(english, 256);
    appendEnv('AEGIS_WALLET_MNEMONIC', mnemonic);
    logger.info('New Preprod wallet created and saved in .env (not printed).');
  }
  if (!process.env.MIDNIGHT_STORAGE_PASSWORD) {
    const pw = 'Ae!' + Buffer.from(webcrypto.getRandomValues(new Uint8Array(24))).toString('base64url') + '#9';
    appendEnv('MIDNIGHT_STORAGE_PASSWORD', pw);
  }
  const storagePassword = process.env.MIDNIGHT_STORAGE_PASSWORD!;

  const seed = Buffer.from(await bip39.mnemonicToSeed(mnemonic));
  const ctx = await initWalletWithSeed(seed);
  const address = ctx.unshieldedKeystore.getBech32Address().asString();
  logger.info(`WALLET ADDRESS (send Preprod tNIGHT here): ${address}`);

  // 2. Sync, wait for funds, register DUST
  logger.info('Syncing wallet...');
  await waitForSync(ctx.wallet);
  await waitForFunds(ctx.wallet);
  await registerNightForDust(ctx);

  // 3. Providers
  const walletAndMidnightProvider = await createWalletAndMidnightProvider(ctx);
  const zkConfigProvider = new NodeZkConfigProvider(ZK_CONFIG_PATH);
  const providers: any = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'aegis-private-state',
      privateStoragePasswordProvider: () => storagePassword,
      accountId: address,
    } as any),
    publicDataProvider: indexerPublicDataProvider(config.indexer, config.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(config.proofServer, zkConfigProvider),
    walletProvider: walletAndMidnightProvider,
    midnightProvider: walletAndMidnightProvider,
  };

  // 4. Deploy
  const compiledContract: any = (CompiledContract as any)
    .make('AEGIS', Contract as any)
    .pipe(
      (CompiledContract as any).withWitnesses(witnesses),
      (CompiledContract as any).withCompiledFileAssets(ZK_CONFIG_PATH),
    );

  logger.info('Deploying AEGIS contract to Preprod (proof generation can take a while)...');
  const deployed: any = await deployContract(providers, {
    compiledContract,
    privateStateId: 'aegisPrivateState',
    initialPrivateState,
  } as any);

  const contractAddress = deployed.deployTxData.public.contractAddress;
  logger.info(`AEGIS deployed at: ${contractAddress}`);

  fs.writeFileSync(
    path.join(ROOT, 'deploy/deployment.json'),
    JSON.stringify({ network: config.networkId, contractAddress, deployedAt: new Date().toISOString() }, null, 2),
  );

  await ctx.wallet.stop();
  process.exit(0);
}

main().catch((e) => {
  logger.error(e);
  process.exit(1);
});