const STORAGE_KEY = 'aegis-private-state'

const DEFAULT_STATE = {
  canPay: true,
  canTrade: true,
  canAccessData: false,
}

let contractAddress = null

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)

    if (!stored) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(DEFAULT_STATE),
      )

      return { ...DEFAULT_STATE }
    }

    return {
      ...DEFAULT_STATE,
      ...JSON.parse(stored),
    }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      canPay: Boolean(state.canPay),
      canTrade: Boolean(state.canTrade),
      canAccessData: Boolean(state.canAccessData),
    }),
  )
}

export function createBrowserPrivateStateProvider() {
  return {
    setContractAddress(address) {
      contractAddress = address
    },

    async set(privateStateId, state) {
      if (!contractAddress) {
        throw new Error('Contract address is not configured.')
      }

      if (privateStateId !== 'aegisPrivateState') {
        throw new Error(`Unknown private state: ${privateStateId}`)
      }

      saveState(state)
    },

    async get(privateStateId) {
      if (!contractAddress) {
        throw new Error('Contract address is not configured.')
      }

      if (privateStateId !== 'aegisPrivateState') {
        throw new Error(`Unknown private state: ${privateStateId}`)
      }

      return loadState()
    },

    async remove(privateStateId) {
      if (privateStateId !== 'aegisPrivateState') {
        throw new Error(`Unknown private state: ${privateStateId}`)
      }

      localStorage.removeItem(STORAGE_KEY)
    },

    async clear() {
      localStorage.removeItem(STORAGE_KEY)
    },

    async setSigningKey() {
      throw new Error('Signing keys are managed by Lace.')
    },

    async getSigningKey() {
      return null
    },

    async removeSigningKey() {
      return undefined
    },

    async clearSigningKeys() {
      return undefined
    },

    async exportPrivateStates() {
      throw new Error('Private state export is not enabled in the demo UI.')
    },

    async importPrivateStates() {
      throw new Error('Private state import is not enabled in the demo UI.')
    },

    async exportSigningKeys() {
      throw new Error('Signing key export is managed by Lace.')
    },

    async importSigningKeys() {
      throw new Error('Signing key import is managed by Lace.')
    },
  }
}
