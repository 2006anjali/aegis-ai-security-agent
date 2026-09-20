import { useState } from 'react'
import './App.css'

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState('')
  const [walletError, setWalletError] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  // Authorization state
  const [authorizationStatus, setAuthorizationStatus] =
    useState('idle')
  const [authorizationResult, setAuthorizationResult] =
    useState('')

  // Selected authorization request
  const [selectedAgent, setSelectedAgent] =
    useState('FinanceBot')
  const [selectedAction, setSelectedAction] =
    useState('Payment Request')

  const stats = [
    {
      label: 'Protected Actions',
      value: '24',
      change: '+12%',
      icon: '🛡️',
    },
    {
      label: 'Verified Requests',
      value: '18',
      change: '+8%',
      icon: '✓',
    },
    {
      label: 'Active Agents',
      value: '3',
      change: 'Stable',
      icon: '◉',
    },
    {
      label: 'Threats Blocked',
      value: '07',
      change: '+3',
      icon: '⚡',
    },
  ]

  const agents = [
    {
      name: 'FinanceBot',
      type: 'Payment Agent',
      status: 'Active',
      permission: 'Can Pay',
      icon: '₿',
    },
    {
      name: 'TradingBot',
      type: 'Portfolio Agent',
      status: 'Active',
      permission: 'Can Trade',
      icon: '↗',
    },
    {
      name: 'SupportAgent',
      type: 'Data Agent',
      status: 'Restricted',
      permission: 'No Data Access',
      icon: '◌',
    },
  ]

  const activities = [
    {
      action: 'Payment Request',
      agent: 'FinanceBot',
      result: 'AUTHORIZED',
      time: '2 min ago',
    },
    {
      action: 'Portfolio Access',
      agent: 'TradingBot',
      result: 'AUTHORIZED',
      time: '18 min ago',
    },
    {
      action: 'Data Access',
      agent: 'SupportAgent',
      result: 'BLOCKED',
      time: '42 min ago',
    },
    {
      action: 'Permission Update',
      agent: 'FinanceBot',
      result: 'VERIFIED',
      time: '1 hr ago',
    },
  ]

  // Available simulated actions for each AI agent.
  // These will later map to private permission state
  // inside the real Midnight Compact circuit.
  const agentActions = {
    FinanceBot: [
      'Payment Request',
      'Portfolio Access',
      'Data Access',
    ],
    TradingBot: [
      'Portfolio Access',
      'Payment Request',
      'Data Access',
    ],
    SupportAgent: [
      'Data Access',
      'Payment Request',
      'Portfolio Access',
    ],
  }

  // Simulated private authorization rules.
  // The real implementation will replace these with
  // private Midnight contract state.
  const authorizationRules = {
    FinanceBot: {
      'Payment Request': true,
      'Portfolio Access': false,
      'Data Access': false,
    },
    TradingBot: {
      'Portfolio Access': true,
      'Payment Request': false,
      'Data Access': false,
    },
    SupportAgent: {
      'Data Access': false,
      'Payment Request': false,
      'Portfolio Access': false,
    },
  }

  // REAL LACE + MIDNIGHT CONNECTION
  const handleConnect = async () => {
    try {
      setWalletError('')
      setIsConnecting(true)

      // Check Midnight wallet providers injected by browser extensions
      const wallets = Object.values(window.midnight ?? {})

      // Select Lace specifically.
      // This prevents 1AM from being selected accidentally.
      const lace = wallets.find(
        (wallet) => wallet.rdns === 'io.lace.wallet',
      )

      if (!lace) {
        throw new Error(
          'Lace wallet not detected. Please make sure the Lace extension is enabled.',
        )
      }

      console.log('Lace detected:', lace.name)
      console.log('Lace API version:', lace.apiVersion)
      console.log('Lace RDNS:', lace.rdns)

      // Connect specifically to Midnight Preview
      const connected = await lace.connect('preview')

      // Confirm connection status
      const status = await connected.getConnectionStatus()

      console.log('Lace connection status:', status)

      if (
        status.status !== 'connected' ||
        status.networkId !== 'preview'
      ) {
        throw new Error(
          'Lace connected, but the Midnight Preview network was not confirmed.',
        )
      }

      // Read the shielded Midnight address
      const addresses = await connected.getShieldedAddresses()

      console.log(
        'Midnight shielded address:',
        addresses.shieldedAddress,
      )

      setWalletConnected(true)
      setWalletAddress(addresses.shieldedAddress || '')
    } catch (error) {
      console.error('Lace connection error:', error)

      setWalletConnected(false)
      setWalletAddress('')
      setWalletError(
        error?.message || 'Unable to connect Lace wallet.',
      )
    } finally {
      setIsConnecting(false)
    }
  }

  // UI disconnect.
  // Midnight DApp Connector v4 does not expose a disconnect()
  // method, so we clear the DApp's local connection state.
  const handleDisconnect = () => {
    setWalletConnected(false)
    setWalletAddress('')
    setWalletError('')
    setAuthorizationStatus('idle')
    setAuthorizationResult('')
  }

  const handleEmergencyLock = () => {
    alert('Emergency Lock activated')
  }

  const handleAgentChange = (event) => {
    const nextAgent = event.target.value
    const nextAction = agentActions[nextAgent][0]

    setSelectedAgent(nextAgent)
    setSelectedAction(nextAction)
    setAuthorizationStatus('idle')
    setAuthorizationResult('')
  }

  const handleActionChange = (event) => {
    setSelectedAction(event.target.value)
    setAuthorizationStatus('idle')
    setAuthorizationResult('')
  }

  // Temporary UI authorization flow.
  // This will later be replaced with the real Midnight Compact circuit call.
  const handleAuthorization = () => {
    if (!walletConnected) {
      setAuthorizationStatus('blocked')
      setAuthorizationResult(
        'Connect Lace before running an authorization check.',
      )
      return
    }

    setAuthorizationStatus('verifying')
    setAuthorizationResult(
      `Checking ${selectedAction} for ${selectedAgent} against the private permission state...`,
    )

    window.setTimeout(() => {
      const isAuthorized =
        authorizationRules[selectedAgent]?.[selectedAction] ??
        false

      if (isAuthorized) {
        setAuthorizationStatus('authorized')
        setAuthorizationResult(
          `${selectedAction} is authorized for ${selectedAgent}. The private permission value was not displayed.`,
        )
      } else {
        setAuthorizationStatus('blocked')
        setAuthorizationResult(
          `${selectedAction} is blocked for ${selectedAgent}. The private permission value was not displayed.`,
        )
      }
    }, 1200)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">A</div>

          <div>
            <div className="brand-name">AEGIS</div>
            <div className="brand-subtitle">
              AI SECURITY AGENT
            </div>
          </div>
        </div>

        <div className="security-status">
          <span className="status-dot"></span>

          <div>
            <strong>System Protected</strong>
            <span>All systems operational</span>
          </div>
        </div>

        <nav className="navigation">
          <p className="nav-label">MAIN MENU</p>

          {[
            'Dashboard',
            'Security',
            'AI Agents',
            'Permissions',
            'Activity',
          ].map((item) => (
            <button
              key={item}
              className={`nav-item ${
                activePage === item ? 'active' : ''
              }`}
              onClick={() => setActivePage(item)}
            >
              <span className="nav-icon">
                {item === 'Dashboard' && '⌂'}
                {item === 'Security' && '◇'}
                {item === 'AI Agents' && '◉'}
                {item === 'Permissions' && '◆'}
                {item === 'Activity' && '◷'}
              </span>

              {item}
            </button>
          ))}

          <p className="nav-label second-label">
            SECURITY
          </p>

          <button
            className="nav-item"
            onClick={handleEmergencyLock}
          >
            <span className="nav-icon">⚠</span>
            Emergency Lock
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="privacy-card">
            <div className="privacy-icon">✦</div>

            <div>
              <strong>Privacy Mode</strong>
              <span>Midnight Network</span>
            </div>

            <span className="privacy-live">LIVE</span>
          </div>

          <div className="profile">
            <div className="profile-avatar">A</div>

            <div className="profile-info">
              <strong>Account Owner</strong>
              <span>Security Admin</span>
            </div>

            <span className="more">•••</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">
              AEGIS / {activePage}
            </p>

            <h1>{activePage}</h1>
          </div>

          <div className="top-actions">
            <button className="notification">
              ♢
              <span></span>
            </button>

            {!walletConnected ? (
              <button
                className="wallet-button"
                onClick={handleConnect}
                disabled={isConnecting}
              >
                <span className="wallet-icon">◈</span>

                {isConnecting
                  ? 'Connecting...'
                  : 'Connect Lace'}

                <span className="arrow">⌄</span>
              </button>
            ) : (
              <button
                className="wallet-button connected-wallet"
                onClick={handleDisconnect}
              >
                <span className="wallet-icon">✓</span>

                Lace Connected

                <span className="arrow">⌄</span>
              </button>
            )}
          </div>
        </header>

        {walletError && (
          <div
            style={{
              margin: '20px 0',
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(239, 68, 68, 0.10)',
              border:
                '1px solid rgba(239, 68, 68, 0.30)',
              color: '#ff7b7b',
              fontSize: '14px',
            }}
          >
            <strong>Lace Connection Error:</strong>{' '}
            {walletError}
          </div>
        )}

        <section className="welcome-row">
          <div>
            <h2>Security Overview</h2>

            <p>
              Your AI agents are protected by private
              authorization rules.
            </p>
          </div>

          <div className="network-badge">
            <span className="network-dot"></span>
            Midnight Preview
          </div>
        </section>

        {walletConnected && (
          <section
            style={{
              marginBottom: '24px',
              padding: '16px 20px',
              borderRadius: '14px',
              background:
                'rgba(34, 197, 94, 0.06)',
              border:
                '1px solid rgba(34, 197, 94, 0.20)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#22c55e',
                }}
              ></span>

              <strong>
                Midnight Preview Connected
              </strong>
            </div>

            <div
              style={{
                fontSize: '12px',
                opacity: 0.65,
                wordBreak: 'break-all',
              }}
            >
              {walletAddress}
            </div>
          </section>
        )}

        <section className="stats-grid">
          {stats.map((stat) => (
            <div
              className="stat-card"
              key={stat.label}
            >
              <div className="stat-top">
                <div className="stat-icon">
                  {stat.icon}
                </div>

                <span className="stat-change">
                  {stat.change}
                </span>
              </div>

              <div className="stat-value">
                {stat.value}
              </div>

              <div className="stat-label">
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        <section className="dashboard-grid">
          <div className="panel agents-panel">
            <div className="panel-header">
              <div>
                <h3>AI Agents</h3>

                <p>
                  Agents currently protected by AEGIS
                </p>
              </div>

              <button className="view-button">
                View all →
              </button>
            </div>

            <div className="agent-list">
              {agents.map((agent) => (
                <div
                  className="agent-row"
                  key={agent.name}
                >
                  <div className="agent-avatar">
                    {agent.icon}
                  </div>

                  <div className="agent-details">
                    <strong>{agent.name}</strong>
                    <span>{agent.type}</span>
                  </div>

                  <div className="agent-permission">
                    <span
                      className={
                        agent.status === 'Active'
                          ? 'permission-active'
                          : 'permission-restricted'
                      }
                    >
                      {agent.permission}
                    </span>
                  </div>

                  <span
                    className={`agent-status ${
                      agent.status === 'Active'
                        ? 'active-status'
                        : 'restricted-status'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel authorization-panel">
            <div className="panel-header">
              <div>
                <h3>Private Authorization</h3>

                <p>
                  Verify an action without exposing
                  private data
                </p>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  '1fr 1fr',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  opacity: 0.8,
                }}
              >
                AI AGENT

                <select
                  value={selectedAgent}
                  onChange={handleAgentChange}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border:
                      '1px solid rgba(148, 163, 184, 0.20)',
                    background:
                      'rgba(15, 23, 42, 0.55)',
                    color: 'inherit',
                    outline: 'none',
                  }}
                >
                  {agents.map((agent) => (
                    <option
                      key={agent.name}
                      value={agent.name}
                      style={{
                        background: '#111827',
                      }}
                    >
                      {agent.name}
                    </option>
                  ))}
                </select>
              </label>

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '7px',
                  fontSize: '12px',
                  fontWeight: 600,
                  opacity: 0.8,
                }}
              >
                REQUESTED ACTION

                <select
                  value={selectedAction}
                  onChange={handleActionChange}
                  style={{
                    width: '100%',
                    padding: '11px 12px',
                    borderRadius: '10px',
                    border:
                      '1px solid rgba(148, 163, 184, 0.20)',
                    background:
                      'rgba(15, 23, 42, 0.55)',
                    color: 'inherit',
                    outline: 'none',
                  }}
                >
                  {agentActions[selectedAgent].map(
                    (action) => (
                      <option
                        key={action}
                        value={action}
                        style={{
                          background: '#111827',
                        }}
                      >
                        {action}
                      </option>
                    ),
                  )}
                </select>
              </label>
            </div>

            <div className="authorization-box">
              <div className="shield-large">
                {authorizationStatus === 'verifying'
                  ? '◌'
                  : authorizationStatus ===
                      'authorized'
                    ? '✓'
                    : authorizationStatus ===
                        'blocked'
                      ? '!'
                      : '🛡'}
              </div>

              <div className="authorization-content">
                <span className="mini-label">
                  {authorizationStatus ===
                  'verifying'
                    ? 'VERIFYING'
                    : authorizationStatus ===
                        'authorized'
                      ? 'AUTHORIZED'
                      : authorizationStatus ===
                          'blocked'
                        ? 'BLOCKED'
                        : 'READY TO VERIFY'}
                </span>

                <h4>
                  {authorizationStatus ===
                  'verifying'
                    ? 'Checking private permission'
                    : authorizationStatus ===
                        'authorized'
                      ? 'Authorization verified'
                      : authorizationStatus ===
                          'blocked'
                        ? 'Authorization denied'
                        : 'Action-specific proof'}
                </h4>

                <p>
                  {authorizationStatus === 'idle'
                    ? `Verify whether ${selectedAgent} can perform ${selectedAction} using a private Midnight authorization rule.`
                    : authorizationResult}
                </p>
              </div>
            </div>

            <button
              className="verify-button"
              onClick={handleAuthorization}
              disabled={
                authorizationStatus === 'verifying'
              }
            >
              {authorizationStatus ===
              'verifying'
                ? 'Verifying...'
                : authorizationStatus ===
                    'authorized'
                  ? 'Verify Again'
                  : authorizationStatus ===
                      'blocked'
                    ? 'Check Again'
                    : 'Verify Authorization'}

              <span>→</span>
            </button>
          </div>
        </section>

        <section className="panel activity-panel">
          <div className="panel-header">
            <div>
              <h3>
                Recent Authorization Activity
              </h3>

              <p>
                Private verification events from your
                security layer
              </p>
            </div>

            <button className="view-button">
              View history →
            </button>
          </div>

          <div className="activity-table">
            <div className="table-header">
              <span>ACTION</span>
              <span>AI AGENT</span>
              <span>RESULT</span>
              <span>TIME</span>
            </div>

            {activities.map((item, index) => (
              <div
                className="activity-row"
                key={index}
              >
                <strong>{item.action}</strong>

                <span>{item.agent}</span>

                <span
                  className={
                    item.result === 'BLOCKED'
                      ? 'result-blocked'
                      : 'result-success'
                  }
                >
                  <i></i>
                  {item.result}
                </span>

                <span className="activity-time">
                  {item.time}
                </span>
              </div>
            ))}
          </div>
        </section>

        <footer className="footer">
          <span>
            AEGIS Security Layer v1.0
          </span>

          <span>
            Powered by Midnight Privacy Technology
          </span>

          <span className="footer-secure">
            ● PRIVATE BY DESIGN
          </span>
        </footer>
      </main>
    </div>
  )
}

export default App