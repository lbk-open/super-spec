---
name: ss-explore-environment
description: Use before troubleshooting a running application, or whenever you need to document its runtime environment, to systematically discover servers, configuration, dependencies, middleware, and observability tooling, then persist the findings to APPLICATION.md so future investigations (including the `ss-inspect` skill) don't start from zero.
---

# Explore Environment

Collect and document the runtime environment of an application: servers, configuration center, service dependencies, middleware, and observability tooling. This prepares the ground for efficient troubleshooting.

**Output:** write findings to `APPLICATION.md` at the project root (this file is the skill's deliverable), and — with the user's consent — register a lazy-load reference to it in `AGENTS.md` so any AI coding tool knows the file exists and when to read it.

**Security rule: never write secrets, passwords, tokens, or credentials into `APPLICATION.md`.** Document only *how* to obtain them — which command, which file, which vault. If a command's output includes credentials, redact them before writing anything down.

## Ground rules

1. **No secrets in output** — document where to find credentials, never the credentials themselves.
2. **Verify before documenting** — run each command and confirm it works before writing it down. If a command fails, mark that entry "not verified" with the error.
3. **Environment-specific** — label every fact with which environment it belongs to (e.g., test / staging / production).
4. **Idempotent** — running this skill again updates `APPLICATION.md` in place; it never duplicates sections.
5. **Source attribution** — for every fact, note how it was discovered (which command, which file, which trace).

## Inputs

- The application name, if not obvious. If not given, auto-detect it from the project (see Step 0).

## Process

### Step 0 — Determine the application name

Auto-detect from the project, in order of preference: the framework's application-name config (e.g., `spring.application.name`), the build manifest's artifact/module name (`pom.xml`, `go.mod`, `package.json`), or fall back to the current directory name. If none of this resolves cleanly, ask the user.

This name is what you use as the identifying parameter for every query below, and what goes into the `APPLICATION.md` header.

### Step 1 — Servers and deployment

Query your infrastructure inventory (CMDB, cloud console, or equivalent) for the application's hosts. Extract, per environment: host IP/hostname, instance type, region/zone, and basic specs (CPU/memory/disk). Document the standard deploy directory convention and how remote access to a host is normally obtained (through your organization's access-control system — do not write the access mechanism's credentials, only the process).

### Step 2 — Configuration center

Find the configuration-center client block in the service's bootstrap/startup configuration (e.g., a `nacos:`, `apollo:`, or `consul:` section in a YAML/properties file). From it, identify: the server address per environment, the namespace/tenant, and the list of extra config files (dataId/group or equivalent) the service loads.

Verify connectivity in a non-production environment only: authenticate using the credentials referenced in the bootstrap file (never write the token itself into `APPLICATION.md`), then fetch one config entry to confirm the address and namespace are correct.

Document: the address per environment, the namespace and how to find it, the config-file naming convention, the group/profile name, how to authenticate (command template, no real credentials), and how to fetch a config (API/CLI template with placeholders).

### Step 3 — Service dependencies

Use recent traces to discover the live dependency topology: pull a handful of recent successful traces for the app and expand their span trees. From the spans, extract downstream RPC/HTTP services (name + address), database connections, cache connections, and any message-queue topics visible.

Supplement with static analysis of the source: search for RPC client declarations (e.g., Dubbo/gRPC consumer config or annotations) and HTTP client usage (Feign, `RestTemplate`, `WebClient`, or the equivalent in other languages).

Document a dependency table (service name, protocol, how discovered) and a short topology summary — what this app calls, and, where visible from trace entry spans, what calls this app.

### Step 4 — Middleware access

For each middleware type in use, document type, endpoint, database/instance name, and how to query it:

- **Relational database** — cluster/instance list from your infra tooling; a quick check of recent slow queries to confirm connectivity.
- **Cache** — instance list and the specific instance this app uses (cross-reference config or trace spans); key-pattern conventions if inferable.
- **Message queue** — topic instances and consumer groups, if the topic name is known from config or source.
- **Search/analytics store** — cluster health check, if the endpoint is known from config.

Note where credentials for each live (e.g., "in the configuration center, under key `xxx`") — never paste them.

### Step 5 — Observability

Verify each observability capability is actually reachable, and document the working query for: alert history, request-rate/latency/error-rate metrics, host and runtime resource metrics, log search (by level, by keyword, by trace ID, with surrounding context), and trace search/lookup (by error status, by high latency).

Document the commands/queries that were verified to actually return data, plus the typical troubleshooting flow used by the `ss-inspect` skill: alerts → error-type distribution → latency/throughput inflection point → error logs → error traces → span tree → host/runtime resource check.

## APPLICATION.md output template

```markdown
# <Application Name> — Runtime Environment

> Generated on YYYY-MM-DD by the `ss-explore-environment` skill.
> **This document contains no secrets.** See each section for how to obtain credentials.

---

## 1. Servers and deployment

| Environment | Host | Hostname | Instance type | Specs |
|-------------|------|----------|----------------|-------|
| test | ... | ... | ... | ... |
| production | ... | ... | ... | ... |

**Deploy directory:** `<path convention>`
**Remote access:** <how to obtain access, via your organization's access-control system>

---

## 2. Configuration center

| Environment | Address | Namespace | Credential source |
|-------------|---------|-----------|--------------------|
| test | ... | ... | bootstrap config → config-center client block |
| production | ... | ... | <how to obtain> |

**How to query:**
```
# 1. Obtain credentials from the bootstrap config
# 2. Authenticate (template, no real values)
# 3. Fetch the config entry
```

**Config files:**
- `<app-name>` — shared config
- `<app-name>-test` — test environment
- `<app-name>-prod` — production

---

## 3. Service dependencies

### Downstream (this app calls)

| Service | Protocol | Address | Discovered via |
|---------|----------|---------|------------------|
| ... | ... | ... | trace / source |

### Upstream (calls this app)

<visible from trace entry spans, if any>

---

## 4. Middleware

### Database
| Environment | Address | Database | How to query |
|-------------|---------|----------|----------------|

### Cache
| Environment | Address | Purpose | How to query |
|-------------|---------|---------|----------------|

### Message queue
| Topic | Environment | How to query |
|-------|-------------|----------------|

### Search/analytics store
| Environment | Address | Index | How to query |
|-------------|---------|-------|----------------|

---

## 5. Observability

**Alerts:** <verified query>
**Metrics:** <verified queries — throughput, latency, error rate, host/runtime resources>
**Logs:** <verified queries — by level, by keyword, by trace ID, context around a log line>
**Traces:** <verified queries — errored traces, high-latency traces, span-tree lookup>

**Typical troubleshooting flow:**
```
Alert fires → confirm via alert history
           → error-type distribution
           → latency/throughput inflection point
           → error logs
           → error traces → span tree
           → host/runtime resource check
```
```

## Step 6 — Offer to register APPLICATION.md in AGENTS.md

`AGENTS.md` belongs to the user's project, not to this toolkit — **never modify or create it without asking**. Once `APPLICATION.md` is written, ask the user:

> "Should I register `APPLICATION.md` in your `AGENTS.md` so AI coding tools know when to read it? I'd add a small managed block (shown below)."

- If the user declines, skip this step and simply mention the block below so they can add it themselves later.
- If `AGENTS.md` does not exist, do not create it on your own; ask whether the user wants one created for this purpose.
- If the user agrees, use a lazy-load reference — a plain-text path, not an eager import. `APPLICATION.md` is large and only relevant to environment/troubleshooting work; eager-loading it would waste context on every session.

Insert (or, if already present, replace in place — this is idempotent) the following managed block. Place it right before any `SS-OPENSPEC`-style managed block if one exists, otherwise append it:

```markdown
<!-- SS-APPLICATION:START -->
## Application environment (APPLICATION.md)

`APPLICATION.md` documents this service's runtime environment: servers/deployment, configuration center, service dependencies, middleware (database/cache/queue/search) access, and observability commands. Read it on demand — do not preload it.

Read it first when:
- Investigating a production/test issue, bug, alert, performance regression, or unexpected behavior.
- You need to query or verify a database, cache, queue, or search cluster.
- You need server addresses, deploy paths, configuration-center addresses, or upstream/downstream dependencies.
- You need log/metric/trace commands.

Skip it for routine feature coding, pure frontend/algorithm logic, or changes unrelated to the runtime environment.
<!-- SS-APPLICATION:END -->
```

Insertion rules: if the `SS-APPLICATION` block already exists, replace it in place rather than duplicating it. Never touch content outside the markers.

## Verification checklist

| # | Check | How |
|---|-------|-----|
| 1 | No secrets in the file | Search the file for password/secret/token/apikey — matches should only appear in "how to obtain" prose |
| 2 | Commands are runnable | At least one command per section was actually executed and returned data |
| 3 | Environment labels correct | Every endpoint/address is tagged with its environment |
| 4 | Idempotent update | Re-running updates sections in place rather than duplicating them |
| 5 | AGENTS.md untouched without consent | If the user agreed to registration: exactly one `SS-APPLICATION` block exists, as a lazy reference (no eager import). Otherwise: `AGENTS.md` unmodified |

## Anti-patterns

| Anti-pattern | Why it's harmful | Do this instead |
|--------------|-------------------|------------------|
| Paste raw command output into APPLICATION.md | Output often contains IPs, keys, tokens in raw form | Extract structured facts, redact secrets |
| Document without verifying | The command or environment may be wrong/unreachable | Run it first, mark unverified if it fails |
| Skip a step because "not relevant" | Future investigators need the full picture | Run every step; mark "N/A" if genuinely empty |
| Write a real password "because it's in the source anyway" | APPLICATION.md may end up shared or committed | Never — write "credentials live in `<file>`" instead |
| Only explore the test environment | Production often has a different topology | Document every available environment |

## Stop signs

- About to write a password/token/secret → stop, write "obtain from `<source>`" instead.
- A command's output contains sensitive data → stop, redact it before writing anything down.
- The tooling needed for a step (CMDB, tracing, etc.) isn't available → stop, tell the user what access is missing.
- Can't determine the application name → stop, ask.

## Examples

```
Explore the environment for order-service
Explore the environment for the checkout application
```
