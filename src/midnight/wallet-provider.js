import {
  Transaction,
} from '@midnight-ntwrk/ledger-v8'

export function createLaceWalletProvider(laceApi) {
  if (!laceApi) {
    throw new Error('Lace wallet is not connected.')
  }

  let cachedAddresses = null

  async function getAddresses() {
    if (!cachedAddresses) {
      cachedAddresses = await laceApi.getShieldedAddresses()
    }

    return cachedAddresses
  }

  return {
    async balanceTx(tx) {
      const serialized = tx.serialize()

      const txBytes = await laceApi.balanceUnsealedTransaction(
        serialized,
        { payFees: true },
      )

      return Transaction.deserialize(
        'signature',
        'proof',
        'binding',
        txBytes.tx,
      )
    },

    async getCoinPublicKey() {
      const addresses = await getAddresses()
      return addresses.shieldedCoinPublicKey
    },

    async getEncryptionPublicKey() {
      const addresses = await getAddresses()
      return addresses.shieldedEncryptionPublicKey
    },
  }
}
