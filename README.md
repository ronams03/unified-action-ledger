# Unified Action Ledger (UAL)

A human-centric, tamper-evident operational action ledger providing universal capture, standardized schema, cross-linking, real-time visibility, rule-based escalations, and robust auditability — without ML/AI.

## Features

- Universal Action Capture Engine: Standard APIs and connectors to log actions from email, ERP, docs, and project tools.
- Standardized Action Schema: Consistent fields for user, timestamp, type, target, department, tags, and state transitions.
- Cross-Referencing & Dependency Mapping: Link actions to form process chains; visualize dependencies.
- Real-Time Process Dashboard: Live status via API; pluggable UI.
- Rule-Based Escalation System: Threshold-driven alerts via email/SMS/chat (extensible channels).
- Tamper-Evident Audit Ledger: Hash-chained, append-only entries with void markers.
- Unified Search & Timeline Explorer: Query by person, date, keyword, project, action type; follow updates.
- Permission & Access Control Layer: RBAC-ready with access logging.
- Integration Gateway: Pre-built connector stubs and open API.
- Process Blueprint Designer (No-Code): Define workflows, SLAs, gap analysis.
- Daily Action Digest: Automated summaries for users/teams.
- Offline & Mobile Capture: Store-and-forward with preserved timestamps.
- Security & Compliance: E2E encryption support, immutable logs, GDPR/CCPA masking, access audit trail.

## Tech Stack

- FastAPI, SQLAlchemy (async), SQLite (aiosqlite), Pydantic v2
- JWT auth, Passlib bcrypt, JOSE
- APScheduler for rules/digests

## Quickstart

1) Python environment

- System Python is locked; create a venv (ensure `python3-venv` is available):

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

If `venv` is unavailable in your environment, install `python3-venv` or use a dev container.

2) Initialize database

```bash
. .venv/bin/activate
python -m app.db.init_db
```

3) Run server

```bash
. .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

4) Docs

- Swagger UI: `http://localhost:8000/docs`

## API Overview (initial)

- Auth
  - POST `/api/auth/register` → create user
  - POST `/api/auth/token` (OAuth2 password) → JWT token

- Actions
  - POST `/api/actions/` → create action (tamper-evident chain)
  - POST `/api/actions/link` → link two actions (dependency graph)
  - POST `/api/actions/{id}/void` → mark action as void (with reason)
  - GET `/api/actions/timeline/{reference_key}` → chronological list

- Health
  - GET `/health`

## Standardized Action Schema

- user: implicit via JWT `sub` (user id)
- timestamp: `created_at` UTC, optional `local_timestamp`
- action_type: e.g., Approve, Edit, Request, Notify, Complete
- target: `target_type`, `target_id`, `target_label`
- department: `department_id`
- context_tags: free-form JSON
- pre_state / post_state: JSON state snapshot
- tamper fields: `prev_hash`, `entry_hash`, `sequence`
- lifecycle: `voided`, `void_reason`, `voided_by`, `voided_at`

## Tamper-Evident Ledger

- Each action’s `entry_hash` = SHA-256 of `{prev_hash, payload}`
- `prev_hash` is the `entry_hash` of the latest prior action
- Append-only; voiding preserves original with metadata

## Rules & Digests (Scaffold)

- Models for `Rule` and `EscalationEvent` included
- Add APScheduler jobs that scan for overdue steps and enqueue notifications

## Permissions & Access Logging (Scaffold)

- `Role`, `Department`, and `AccessLog` models included
- Add route dependencies to enforce RBAC and write access logs

## Integration Gateway (Scaffold)

- Add connector modules to push/pull from Gmail/Outlook, SharePoint/Google Drive, Jira/Asana, ERP
- Use webhooks or polling; normalize to ActionCreate payloads

## Process Blueprints (Scaffold)

- Define workflow steps and SLAs via `Blueprint` and `BlueprintStep`
- Track execution with `ProcessInstance` and `ProcessStepInstance`

## Offline & Mobile Capture

- Use `is_offline_capture` + `device_id` + `local_timestamp`
- Mobile/edge clients queue entries and sync when online

## Security Notes

- Change `secret_key` via environment variable
- Use HTTPS in production; configure CORS
- Enable DB backups and secure export channels

## Roadmap

- RBAC enforcement and access logging middleware
- Search endpoints with filters and pagination
- Rules scheduler and notification channels
- Dashboard UI (React/Vite) and blueprint designer UI
- Pre-built connectors and webhook adapters

## License

MIT
