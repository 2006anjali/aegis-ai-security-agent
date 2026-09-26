import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js'
import { createCircuitCallTxInterface } from '@midnight-ntwrk/midnight-js-contracts'
import { Contract } from '../../contract/src/managed/aegis/contract/index.js'
import { browserWitnesses } from './private-state.js'
import { createBrowserPrivateStateProvider } from './private-state-provider.js'
import {
  createLaceProofProvider,
  createZkConfigProvider,
} from './browser-providers.js'
import { createLaceWalletProvider } from './wallet-provider.js'
import { createLaceMidnightProvider } from './midnight-provider.js'

const PRIVATE_STATE_ID = 'aegisPrivateState'

const INDEXER_URL =
  'https://indexer.preprod.midnight.network/api/v4/graphql'

const INDEXER_WS_URL =
  'wss://indexer.preprod.midnight.network/api/v4/graphql/ws'

export async function createAuthorizationCircuit(
  laceApi,
  contractAddress,
) {
  if (!laceApi) {
    throw new Error('Lace wallet is not connected.')
  }

  if (!contractAddress) {
    throw new Error(
      'AEGIS Preprod contract address is not configured.',
    )
  }

  // Load the indexer provider only when the circuit is actually needed.
  // This keeps the heavy indexer dependency out of the initial UI bundle.
  const { indexerPublicDataProvider } = await import(
    '@midnight-ntwrk/midnight-js-indexer-public-data-provider'
  )

  const zkConfigProvider = createZkConfigProvider()
  const proofProvider = await createLaceProofProvider(laceApi)

  const walletProvider = createLaceWalletProvider(laceApi)
  const midnightProvider = createLaceMidnightProvider(laceApi)

  const privateStateProvider = createBrowserPrivateStateProvider()

  privateStateProvider.setContractAddress(contractAddress)

  // Explicitly provide the browser's native WebSocket implementation.
  const publicDataProvider = indexerPublicDataProvider(
    INDEXER_URL,
    INDEXER_WS_URL,
    globalThis.WebSocket,
  )

  const compiledContract = CompiledContract.make(
    'AEGIS',
    Contract,
  )

  const configuredContract = CompiledContract.withWitnesses(
    compiledContract,
    browserWitnesses,
  )

  const providers = {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider,
    proofProvider,
    walletProvider,
    midnightProvider,
  }

  return createCircuitCallTxInterface(
    providers,
    configuredContract,
    contractAddress,
    PRIVATE_STATE_ID,
  )
}

export async function callVerifyAuthorization(
  circuitInterface,
  actionCode,
) {
  if (!circuitInterface) {
    throw new Error('Authorization circuit is not initialized.')
  }

  return circuitInterface.verifyAuthorization(
    BigInt(actionCode),
  )
}

