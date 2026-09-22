export function createLaceMidnightProvider(laceApi) {
  if (!laceApi) {
    throw new Error('Lace wallet is not connected.')
  }

  return {
    async submitTx(tx) {
      const serialized = tx.serialize()

      await laceApi.submitTransaction(serialized)

      return 'submitted-to-lace'
    },
  }
}
