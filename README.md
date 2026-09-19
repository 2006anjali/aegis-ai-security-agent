# AEGIS — AI Personal Security Agent

AEGIS is a privacy-focused security dashboard built on the Midnight network.

It is designed as a personal security layer for AI agents and simulated digital actions. Instead of exposing sensitive permission information publicly, AEGIS is designed to verify whether an action is authorized using Midnight's privacy model.

## Core Idea

AEGIS allows a user to connect a Lace wallet and manage private permissions for AI agents.

Example private permission state:

- CanPay = TRUE
- CanTrade = TRUE
- CanAccessData = FALSE

When an AI agent requests an action, AEGIS is designed to verify the required permission privately and return an authorization result without exposing the underlying private permission data.

## Planned Security Flow

User
↓
Lace Wallet
↓
AEGIS Security Dashboard
↓
AI Agent Action Request
↓
Private Authorization Circuit
↓
Authorization Result
↓
Security History

## Main Features

- Lace wallet connection
- Wallet connection status
- AI agent management
- Permission management
- Simulated security requests
- Private authorization verification
- Authorization history
- Security overview dashboard
- Emergency lock concept
- Midnight smart contract integration

## AI Agents

AEGIS is designed to support multiple AI agents, including:

- FinanceBot
- TradingBot
- SupportAgent

Each agent can be associated with action-specific permissions.

## Privacy Model

AEGIS is being built around Midnight's privacy-preserving smart contract model.

The intended privacy behavior is:

1. Permission data is kept private.
2. A circuit evaluates whether a requested action is authorized.
3. The application receives the verification result.
4. Sensitive permission values are not intended to be revealed to the public ledger.

The final implementation and privacy behavior will be verified after the Compact contract is compiled and deployed to Midnight Preprod.

## Technology Stack

### Frontend

- React
- Vite
- JavaScript
- CSS

### Midnight Integration

- Midnight.js
- Midnight DApp Connector API
- Compact smart contracts
- Lace wallet

### Development

- Node.js
- npm
- Git
- VS Code

## Project Status

Current stage: Level 2 development

Completed:

- React/Vite project setup
- AEGIS security dashboard UI
- Lace provider detection
- Lace wallet connection flow
- Wallet connection status handling
- Midnight JavaScript dependencies
- Production frontend build
- Git repository initialization

In progress:

- Compact smart contract
- Private authorization circuit
- Frontend circuit call
- Midnight Preprod deployment
- Privacy behavior demonstration
- Public contract verification

## Level 2 Target

The project is being developed toward the Midnight RiseIn Level 2 requirements:

- Lace wallet connect/disconnect
- Successful circuit call from frontend
- Observable privacy behavior
- Midnight Preprod contract deployment
- Verifiable contract address
- Public GitHub repository
- Demonstration video
- Meaningful Git commits

## Future Level 3 Direction

The AEGIS architecture is intended to support future expansion into a more production-oriented privacy application.

Potential extensions include:

- Multiple AI agents
- More advanced authorization rules
- Selective disclosure
- Security audit history
- Contract tests
- CI/CD automation
- Expanded privacy-preserving access control

The Level 3 concept will be aligned with the official RiseIn approved project categories before submission.

## Local Development

Install dependencies:

```bash
npm install