# Multi-Repo Detection

Read confirmed input and artifacts, not recency or names alone.

| Signal | Evidence | Action |
| --- | --- | --- |
| Deterministic | Master plan **Repos:** has multiple repos; linked sub-plans each have **Repo:**; complete matching **Problem ID:** report lists multiple **Repositories Requiring Fix:** | Route confirmed scope, preserving original gate context |
| Strong | Proposal **Repositories Involved:** or real source paths require code changes in multiple canonical roots | Confirm scope; explicit --auto may complete an eligible bounded policy gate |
| Heuristic | Narrative names services/apps that might require separate changes | Investigate ownership; don't guess repos or use --decide as approval |

Parse **Repositories Requiring Fix:** bullet entries and require dedicated
**Affected Paths:** bullets; empty/inline ambiguous lists or missing identity are
incomplete. Read-only API/schema/spec references and modules within a monorepo
are not extra repo owners. A shared contract repository with actual required code
changes is not silently excluded; confirm dependency/ownership explicitly.

Handoff includes sanitized original input, stable task/repo/Problem ID, exact
proposal/delta/RCA/plan paths and current byte bindings, detection evidence,
normalizedFlags, gateCompletion (human/auto/pending), authorizedScope, workspace,
currentFingerprint and the one external checkpoint. The single-repo chain stops;
ss-multi-repo-workflow reuses linked matching artifacts and checks real native
capabilities/working directories before runners. Never invent a CLI fallback,
losing gate context or approval because a handoff changed sessions.
