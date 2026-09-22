import { CostModel } from '@midnight-ntwrk/midnight-js-protocol/ledger'
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider'
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider'

const ZK_CONFIG_BASE_URL = '/contracts/aegis'

export function createZkConfigProvider() {
  return new FetchZkConfigProvider(ZK_CONFIG_BASE_URL)
}

export async function createLaceProofProvider(laceApi) {
  if (!laceApi) {
    throw new Error('Lace wallet is not connected.')
  }

  const zkConfigProvider = createZkConfigProvider()

  return dappConnectorProofProvider(
    laceApi,
    zkConfigProvider,
    CostModel.initialCostModel(),
  )
}
