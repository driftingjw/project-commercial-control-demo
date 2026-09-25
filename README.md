# Project Commercial Control

**Designed and built by Hanchen Wang.** An English portfolio demonstration of a project commercial management, settlement and document-control platform.

[Open the live demonstration](https://driftingjw.github.io/project-commercial-control-demo/)

This standalone, static edition reconstructs the workflow and module structure using a completely fictional industrial project. It contains no production database, real commercial documents, credentials, private employee records or employer branding.

## Explore

- Commercial and Finance workspaces, with explicit SC and SG business scopes.
- CT / WO / VO / SA contract hierarchy and standalone supplement packages.
- Settlement entry, pending amounts, commercial certification and Finance payment records.
- Execution budgets, budget overrides, classification, project areas and cash-flow reports.
- Owner documents and receipts, other expenses, counterparty files, sample guarantees.
- Simulated role capabilities, before/after audit records and validation errors.
- A short guided tour and an explanation of the original platform architecture.

## Demo boundary

Changes are stored only in the current browser's `localStorage`. They are not written to a server and are not guaranteed to remain available. Clearing site data or choosing **Reset demo** restores the fictional starting data. When browser storage is unavailable, edits remain in memory until the page closes or reloads.

Role switching is a demonstration, not authentication. The entire dataset is public. No real passwords, uploads, payments or personal information are required. No analytics or third-party scripts are used by this application. GitHub Pages itself processes ordinary hosting requests under GitHub's privacy policy.

The original application uses a browser interface, a Python service and SQLite project data with authoritative server-side controls. Its commercial archive is read-only to the application. This portfolio uses independent JavaScript logic and should not be used for real business operations.

## Run locally

Serve this directory with any static HTTP server, for example `python -m http.server 8094 --bind 127.0.0.1`, then open `http://127.0.0.1:8094/`. No build, package installation or database is required.

## Hosting

The site supports GitHub Pages project paths through relative assets and hash-based navigation. Publish the repository root from the `main` branch. `.nojekyll` disables Jekyll processing. No automatic expiration or deletion is configured. Keep the repository and Pages deployment enabled to retain the public link beyond two months.

## Validation

Run `node --test tests/model.test.mjs` for calculation, hierarchy, pending-amount, permission, cache and transaction checks. Browser acceptance additionally covers interactions and layout.

All rights reserved. Published for portfolio evaluation; no reuse license is granted.
