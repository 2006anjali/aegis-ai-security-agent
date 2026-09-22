const DEFAULT_PRIVATE_STATE = {
  canPay: true,
  canTrade: true,
  canAccessData: false,
}

let privateState = { ...DEFAULT_PRIVATE_STATE }

export function getPrivateState() {
  return { ...privateState }
}

export function setPrivateState(nextState) {
  privateState = {
    canPay: Boolean(nextState.canPay),
    canTrade: Boolean(nextState.canTrade),
    canAccessData: Boolean(nextState.canAccessData),
  }

  return getPrivateState()
}

export const browserWitnesses = {
  canPay: ({ privateState: state }) => [state, state.canPay],
  canTrade: ({ privateState: state }) => [state, state.canTrade],
  canAccessData: ({ privateState: state }) => [
    state,
    state.canAccessData,
  ],
}
