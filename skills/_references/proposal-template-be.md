# {Requirement Name} - Backend Technical Proposal

## Revision History

| Version | Date | Author | Notes |
|---------|------|--------|-------|
| V1.0 | YYYY-MM-DD | xxx | Initial draft |

---

## 1. Overview

### 1.1 Background

> - **Background**: [why this is needed, what problem it solves]
> - **Summary**: [one or two sentences summarizing the requirement]
> - **Goal**: [measurable acceptance criteria]
> - **Scope**: [services/modules affected]

### 1.2 Glossary

| # | Term | Description |
|---|------|-------------|
| 1 | xxx | xxx |

### 1.3 Related Documents

| Document | Role | Owner |
|----------|------|-------|
| PRD | Product | xxx |
| API spec (OpenAPI) | Backend | xxx |
| Task tracker link | PM | xxx |

---

## 2. High-Level Design

### 2.1 Current Architecture

Describe the current architecture and flow relevant to this change:

- Core call chain (which services, how they interact)
- Key data flow
- (Recommended) architecture or sequence diagram

### 2.2 Affected Applications

Mark which applications/services this change touches:

| Application | Change Type | Notes |
|-------------|-------------|-------|
| xxx-service | Modified | xxx |
| xxx-job | New module | xxx |

**Repositories Involved:** <every repository that needs a code commit; for a single-repo change, list the current repo name. Exclude the shared API-contract repo and the specs submodule. Downstream workflows use this field for multi-repo routing.>

### 2.3 Target Design

Describe the target architecture after the change:

- New/modified modules and their responsibilities
- Interaction between modules (sync / async / event-driven / message queue)
- (Recommended) target architecture diagram

### 2.4 Alternatives Considered (optional)

When multiple viable approaches exist:

| Dimension | Option A | Option B |
|-----------|----------|----------|
| Implementation cost | X person-days | X person-days |
| Performance impact | ... | ... |
| Extensibility | ... | ... |
| Risk | ... | ... |

**Recommended option:** Option A, because: [reasoning]

---

## 3. Detailed Design

### 3.1 Performance Requirements

- API response time < XXXms (P95/P99)
- Throughput > XXX QPS
- Estimated data volume: xxx

### 3.2 Business Flow

Describe each change point:

#### 3.2.1 [Change point name]

**Why this change is needed**:

**Current approach**:

```java
// current core code path
```

**New approach**:

```java
// code or pseudocode after the change
```

**What changes**:

1. Change 1
2. Change 2

#### 3.2.2 [Change point name]

(same structure as above)

### 3.3 API Design

#### 3.3.1 Changes to Existing Endpoints

| URL | Description | Change | Notes |
|-----|--------------|--------|-------|
| GET /api/xxx | xxx | added field xxx | — |

#### 3.3.2 New Endpoints

| URL | Description | Notes |
|-----|--------------|-------|
| POST /api/xxx | xxx | — |

New endpoint definitions:

**POST /api/xxx**

- Request:

```json
{
  "field1": "string",
  "field2": 0
}
```

- Response:

```json
{
  "code": 0,
  "data": {}
}
```

#### 3.3.3 Internal RPC / Message Queue Interfaces (optional)

| Interface / Topic | Type | Producer | Consumer | Notes |
|--------------------|------|----------|----------|-------|
| xxx_topic | Kafka | xxx-service | xxx-job | xxx |

### 3.4 Data Model Changes

#### New Tables

```sql
CREATE TABLE xxx (
    id BIGINT NOT NULL AUTO_INCREMENT,
    -- ...
    PRIMARY KEY (id),
    KEY idx_xxx (field1, field2)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='xxx';
```

#### Table Alterations

```sql
ALTER TABLE xxx ADD COLUMN new_field VARCHAR(64) DEFAULT '' COMMENT 'xxx';
```

#### Cache Design (optional)

| Key format | Value | TTL | Notes |
|------------|-------|-----|-------|
| `prefix:{id}` | JSON | 5min | xxx |

### 3.5 Configuration Changes (optional)

| Config key | Value | Notes |
|------------|-------|-------|
| xxx.enabled | true | feature flag |

---

## 4. Non-Functional Design

### 4.1 Compatibility & Migration

- **Forward compatibility**: how old requests/data are handled
- **Rollout strategy**: staged rollout support?
- **Rollback plan**: rollback steps and blast radius
- **Data migration**: migration and rollback approach, if any

### 4.2 Monitoring & Alerting (optional)

- Key metrics to monitor
- Alert thresholds and notification channels

---

## 5. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance risk | Low/Medium/High | xxx | xxx |
| Data consistency issue | Low/Medium/High | xxx | xxx |
| External dependency unavailable | Low/Medium/High | xxx | xxx |

---
