const ACTION_CODES = {
  'Payment Request': 0n,
  'Portfolio Access': 1n,
  'Data Access': 2n,
}

export function getActionCode(action) {
  if (!(action in ACTION_CODES)) {
    throw new Error(`Unsupported authorization action: ${action}`)
  }

  return ACTION_CODES[action]
}

export function getActionLabel(actionCode) {
  const entry = Object.entries(ACTION_CODES).find(
    ([, code]) => code === actionCode,
  )

  return entry?.[0] ?? 'Unknown Action'
}
