# Architecture

SuperSpec is a portable prompt bundle, not an executable workflow engine. Each
ss-* directory contains SKILL.md with name/description frontmatter. The shared
ss-references and ss-guardrails libraries travel with every installation.
[Install the complete bundle](../INSTALL.md); single-skill copying breaks sibling links.

## Contracts and ownership

The three delivery workflows are thin orchestrators. Main coordinates and
arbitrates; one continuous owner investigates/plans/codes/fixes a shared boundary.
A fresh read-only reviewer checks the complete causal surface. Only afterward does
one retained verifier run single-flight full validation. Proven independent
repositories can have separate owners with explicit dependency edges.

Shared [policy](../skills/ss-references/workflow-common.md),
[checkpoint](../skills/ss-references/workflow-checkpoint.md),
[discipline](../skills/ss-references/agent-discipline.md) and
[delta timing](../skills/ss-references/openspec-delta.md) are the common source.
One host-managed protected external checkpoint links original results/logs; no
mandatory Node runtime, database, signing package, coordinator or retention engine.

## Distribution and checks

Local Claude and Codex manifests plus package.json's Pi skill declaration point
at the same skills tree. Versions and 20-skill count are unchanged. No public
registry destination is inferred. Manual discovery copies directories unchanged.

The repository validator checks manifests, all local Markdown/manifest paths,
frontmatter, English documentation and prompt contracts with weakening mutations.
Node is a development test dependency, not workflow runtime. Static checks cannot
prove a model will follow instructions, real native child cwd, installation, or
live host completion; those need separately authorized platform evidence.
