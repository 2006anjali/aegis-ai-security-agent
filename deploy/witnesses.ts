import type { Witnesses } from '../contract/src/managed/aegis/contract/index.js';

export type AegisPrivateState = {
  canPay: boolean;
  canTrade: boolean;
  canAccessData: boolean;
};

// Demo defaults. These stay on the user's machine and are never published.
export const initialPrivateState: AegisPrivateState = {
  canPay: true,
  canTrade: true,
  canAccessData: false,
};

export const witnesses: Witnesses<AegisPrivateState> = {
  canPay: ({ privateState }) => [privateState, privateState.canPay],
  canTrade: ({ privateState }) => [privateState, privateState.canTrade],
  canAccessData: ({ privateState }) => [privateState, privateState.canAccessData],
};