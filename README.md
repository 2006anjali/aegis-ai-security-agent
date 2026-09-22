# AEGIS — AI Personal Security Agent

AEGIS is a privacy-focused AI security dashboard built on the Midnight network.

The project demonstrates how an AI agent can request an action and how a user's private authorization state can be used to determine whether that action is permitted, without exposing the underlying permission values as public application data.

## Project Goal

AEGIS acts as a privacy layer between AI agents and sensitive user permissions.

Example private permission state:

* `canPay = true`
* `canTrade = true`
* `canAccessData = false`

If an AI agent requests an action such as a payment, AEGIS can evaluate the corresponding permission through a Compact circuit.

The intended privacy behavior is that the permission value is used as private witness/state data, while the authorization decision can be returned to the application.

---

## Security Flow

```text
User
  |
  v
Lace Wallet
  |
  v
AEGIS Security Dashboard
  |
  v
AI Agent Action Request
  |
  v
Midnight Authorization Circuit
  |
  v
Private Permission Evaluation
  |
  v
Authorization Result
  |
  v
Security Activity History
```

---

## Main Features

* Lace wallet detection and connection
* Midnight Preview network connection
* Wallet connection status
* Shielded address display
* AI agent management
* Action-based authorization
* Private permission state
* Midnight Compact authorization circuit
* ZK configuration artifacts
* Privacy verification UI
* Authorization activity history
* Emergency security lock
* Midnight.js frontend integration
* Preprod deployment preparation

---

## AI Agents

AEGIS is designed around AI agents that may request sensitive actions.

Current example agents:

* FinanceBot
* TradingBot
* SupportAgent

Example action requests:

* Payment Request
* Portfolio Access
* Data Access

Each action can be mapped to a corresponding private authorization rule.

---

## Privacy Model

AEGIS uses Midnight's privacy-preserving architecture to separate sensitive authorization state from publicly observable application data.

The Compact contract defines private witnesses:

```text
canPay()
canTrade()
canAccessData()
```

The authorization circuit receives an action code and evaluates the corresponding private permission.

Conceptually:

```text
Action Request
      |
      v
Private Witness
      |
      v
Authorization Circuit
      |
      v
Allowed / Denied
```

The underlying permission value is not intended to be exposed as ordinary public application state.

### Important implementation note

The browser development version currently uses a local private-state provider for frontend integration.

Browser `localStorage` is **not a cryptographically secure secret store**. It is used here to maintain the frontend's private-state interface during development. The privacy claim being demonstrated by the Midnight circuit concerns what is exposed through the contract/ledger flow, not protection against a compromised user's browser.

The final privacy behavior will be demonstrated after successful Midnight Preprod deployment and a real frontend circuit execution.

---

## Midnight Smart Contract

The Compact contract is located at:

```text
contract/src/aegis.compact
```

The main circuit is:

```text
verifyAuthorization(action)
```

Supported action codes:

| Action           | Code | Private Permission |
| ---------------- | ---: | ------------------ |
| Payment Request  |  `0` | `canPay`           |
| Portfolio Access |  `1` | `canTrade`         |
| Data Access      |  `2` | `canAccessData`    |

The circuit evaluates the appropriate private witness and returns the authorization decision.

It also maintains:

* `verificationCount`
* `lastDecision`

---

## Frontend Midnight Integration

The frontend integration is organized under:

```text
src/midnight/
```

Main integration modules:

```text
src/midnight/
├── authorization.js
├── browser-providers.js
├── circuit.js
├── config.js
├── midnight-provider.js
├── private-state-provider.js
├── private-state.js
└── wallet-provider.js
```

The integration prepares:

* Lace DApp Connector
* Midnight proof provider
* ZK configuration provider
* Private state provider
* Public data provider
* Wallet provider
* Midnight transaction provider
* Compact circuit interface

ZK artifacts are served from:

```text
public/contracts/aegis/
```

---

## Lace Wallet

AEGIS uses the Midnight DApp Connector API to detect and connect to Lace.

The frontend connects to the Midnight Preview network and retrieves the connected shielded address information.

The dashboard displays:

```text
Lace Connected
Midnight Preview Connected
Shielded Address
```

The UI also provides a disconnect action that clears the application's active wallet connection state.

---

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* CSS

### Blockchain / Privacy

* Midnight Network
* Compact
* Midnight.js
* Midnight DApp Connector API
* Lace Wallet
* Zero-knowledge proof infrastructure

### Development

* Node.js
* npm
* Git
* VS Code
* Docker
* WSL2

---

## Repository Structure

```text
aegis/
│
├── contract/
│   └── src/
│       └── aegis.compact
│
├── deploy/
│   ├── deploy.ts
│   └── witnesses.ts
│
├── public/
│   └── contracts/
│       └── aegis/
│           ├── verifyAuthorization.prover
│           ├── verifyAuthorization.verifier
│           └── verifyAuthorization.zkir
│
├── src/
│   ├── midnight/
│   │   ├── authorization.js
│   │   ├── browser-providers.js
│   │   ├── circuit.js
│   │   ├── config.js
│   │   ├── midnight-provider.js
│   │   ├── private-state-provider.js
│   │   ├── private-state.js
│   │   └── wallet-provider.js
│   │
│   ├── App.jsx
│   ├── App.css
│   └── index.css
│
├── package.json
├── README.md
└── .gitignore
```

---

## Level 2 Requirement Status

| Requirement                  | Status                                  |
| ---------------------------- | --------------------------------------- |
| Lace wallet connect          | Implemented                             |
| Lace disconnect UI           | Implemented                             |
| Midnight.js integration      | Implemented                             |
| DApp Connector integration   | Implemented                             |
| Private state interface      | Implemented                             |
| Frontend circuit interface   | Prepared                                |
| Successful real circuit call | Pending Preprod execution               |
| Observable privacy behavior  | UI prepared; final verification pending |
| Midnight Preprod deployment  | Pending                                 |
| Verifiable contract address  | Pending deployment                      |
| Public GitHub repository     | Complete                                |
| Meaningful Git commits       | Complete                                |
| Live demo                    | Pending deployment                      |
| Demo video                   | Pending successful circuit execution    |

---

## Development Verification

The frontend production build has been verified successfully with:

```bash
npm run build
```

Expected result:

```text
✓ built successfully
```

The repository also contains the generated ZK artifacts required by the frontend Midnight integration.

---

## Current Development Stage

**Midnight RiseIn — Level 2: Waxing Crescent**

Current focus:

1. Complete frontend Midnight circuit execution.
2. Deploy the Compact contract to Midnight Preprod.
3. Record the verifiable contract address.
4. Verify the privacy behavior through a real circuit call.
5. Deploy the frontend.
6. Record the final demonstration video.
7. Complete the final Level 2 submission checklist.

---

## Future Direction

The architecture can later be extended with:

* Multiple AI agents
* More authorization rules
* Selective disclosure
* Privacy-preserving access control
* Security audit history
* Contract tests
* CI/CD automation
* Expanded Midnight integrations

Future functionality will be aligned with the approved project requirements for subsequent challenge levels.

---

## Local Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Build the production frontend:

```bash
npm run build
```

The application is currently developed and tested locally before final Midnight Preprod deployment.
