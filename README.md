# CyberShield AI — VS Code recreation

This is an original React/Vite recreation based on the publicly visible CyberShield AI page, with a matching dark navy/cyan visual style and an interactive demo console. It is not the original Lovable source code.

## Requirements
- Node.js LTS
- VS Code

## Run locally
1. Extract this ZIP.
2. Open the extracted `cybershield-ai-vscode` folder in VS Code.
3. Open Terminal → New Terminal.
4. Run:
   ```bash
   npm install
   npm run dev
   ```
5. Open the local URL printed by Vite (usually `http://localhost:5173`).

## Pages
- `/` — CyberShield AI landing page
- `/console` — interactive security console

## Interactive demo features
- Search alerts by ID, attack type, source IP, target, or status
- Filter by severity and incident status
- Select alerts to view incident details and mitigation guidance
- Change demo incident status
- Export currently filtered alerts to CSV
- Reset sample data

## Important
All security events and charts are simulated demo data. This does not monitor live network traffic and does not include a connected machine-learning model or backend. The mitigation recommendations are informational only; the app does not execute security actions on your machine.
