import { MIDNIGHT_CONFIG } from './config.js'
import { getActionCode } from './authorization.js'

export function isContractConfigured() {
  return Boolean(MIDNIGHT_CONFIG.contractAddress)
}

export function prepareAuthorizationCall(action) {
  if (!isContractConfigured()) {
    return {
      ready: false,
      reason: 'AEGIS Preprod contract address is not configured yet.',
    }
  }

  return {
    ready: true,
    contractAddress: MIDNIGHT_CONFIG.contractAddress,
    circuit: MIDNIGHT_CONFIG.circuitName,
    action: getActionCode(action),
  }
}
