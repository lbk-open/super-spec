---
name: ss-references
description: Shared prompt policies and templates for workflow context, ownership, OpenSpec deltas, proposals and repository routing; not a standalone workflow.
---

# Shared References

Other skills read these files on demand; this library is not invoked directly.

| Reference | Purpose |
| --- | --- |
| [workflow-common.md](workflow-common.md) | Invocation flags, scope, gates, ordered quality chain |
| [workflow-checkpoint.md](workflow-checkpoint.md) | One protected external checkpoint, identities, current evidence, recovery |
| [agent-discipline.md](agent-discipline.md) | Continuous owner, fresh reviewers, retained verifier and safe waiting |
| [openspec-delta.md](openspec-delta.md) | Proposal/delta before gate, staging and materialization/archive |
| [implementer-prompt.md](implementer-prompt.md) | Owner handoff and focused TDD |
| [proposal-template.md](proposal-template.md) | Architecture/API/UI proposal structure |
| [proposal-writing.md](proposal-writing.md) | Proposal quality checklist |
| [openspec-skeleton.md](openspec-skeleton.md) | Authorized OpenSpec bootstrap |
| [multi-repo-detection.md](multi-repo-detection.md) | Evidence-backed repository routing |

Keep every ss-* directory side by side when installing the whole bundle. Sibling
references must resolve after copying skills. Shared policy is prompt-first: no
mandatory Node helper, signing engine, artifact database, package or coordinator.
Repository static tests use Node; executing workflows does not require Node.
