---
name: ss-write-proposal-be
description: Use when you have a PRD or requirement description and need a complete backend technical proposal before writing any code. Filters the requirement down to this service's boundary, analyzes existing architecture and API contracts, and produces a Markdown proposal with full DDL, request/response definitions, and a risk assessment — gated by a self-review and, when available, an independent reviewer pass.
---

# Write Backend Technical Proposal

Generate a comprehensive backend technical proposal from a PRD or requirement description.

**When not to use:**
- Small bug fixes or config-only changes with no architecture decisions.
- One-line code changes or typo fixes.
- Changes already fully specified in an existing proposal.

**Announce at the start:** "Using the ss-write-proposal-be skill to generate the backend technical proposal."

## Inputs

- A link to a requirement document that your document-reading tool can fetch, or a plain-text requirement description. If neither is available, ask the user for one.

If the input is a document link, read its content with whatever document-reading tool is available in your environment. Otherwise treat the input as a plain-text requirement description directly.

## Hard Gates

Before writing, verify each item. If any fails, stop and explain to the user:

- [ ] The PRD/requirement input is readable (the link is accessible, or the text description is substantive).
- [ ] The input contains concrete functional requirements, not just a concept or goal statement.
- [ ] The current repository's code is compilable/runnable, so its existing architecture can be analyzed.

If requirements are vague or ambiguous, ask the user for clarification — never assume silently.

## Anti-Patterns

The following are proposal failures — never allowed:

| Anti-Pattern | Correct Approach |
|-------------|-----------------|
| Copy-pasting large sections of the PRD as "background" | Background should be ≤10% of the proposal — only the context needed for tech decisions |
| Data model says "add a table" without DDL | Include complete `CREATE TABLE` statements |
| API design says "add an endpoint" without a definition | Include full request/response structures (inline or by reference to the OpenAPI contract) |
| Presenting a single approach when clearly better alternatives exist | Compare viable paths and recommend one |
| Placeholders: TBD, TODO, "to be determined", "fill in later" | Complete every section immediately; ask the user if stuck |
| Unilaterally splitting delivery into "Phase 1 / Phase 2," designing only a "P0 / core" subset, or proposing an MVP/demo/simplified version | Cover 100% of the PRD's functional points; phasing or scope cuts only on an explicit user instruction, recorded in the proposal |
| Silently narrowing scope to route around a blocker (missing information, external dependency) | Stop and ask the user; a document split (Step 1) reorganizes delivery — every split proposal still gets written, nothing is cut |
| "Refer to module X" without specifics | Show concrete code paths or pseudocode |
| Introducing unnecessary complexity (new framework/middleware/abstraction) | Use the simplest approach with the existing tech stack; recommend a simpler path when available |
| "While we're at it" refactoring of unrelated modules | Only changes within the requirement's scope |

## Process

### Step 1: Scope Check & Service Boundary

After reading the PRD, identify what's relevant to **this repository/service**:

1. **Identify this service's role.** Read `APPLICATION.md` (if it exists) or analyze the codebase to understand what this service is responsible for.
2. **Extract the relevant scope from the PRD.** A PRD typically spans multiple services (frontend, backend, upstream/downstream). Filter out only the parts that belong to this service.
3. **Define the service boundary.** Clearly identify:
   - What this service WILL implement (in-scope)
   - What belongs to other services (out-of-scope, marked as an external dependency)
   - Integration points with other services (APIs to call / APIs to expose)
4. **Record the repository list.** The proposal MUST carry a structured field, **`Repositories Involved:`**, in its summary-design section — every repository whose code must change for this requirement (write the current repo's name if it's single-repo). Do not count a shared API-contract repo or spec submodules. Downstream workflows read this field for multi-repo routing — see `../_references/multi-repo-detection.md`.

If the in-scope work involves **3+ independent subsystems** within this service:
- Suggest splitting into multiple independent proposals.
- Each proposal should be independently deliverable and verifiable.
- Confirm the split approach with the user before continuing.

If the requirement is focused, proceed.

### Step 2: Context Gathering

1. **Read the PRD/requirement** using the method decided in Inputs above.
2. **Discover API definitions.** Search the repository for OpenAPI YAML files (e.g., under `api/`, `contracts/`, `docs/api/`, or any `*.yaml`/`*.yml` with OpenAPI markers). If found, read the relevant definitions.
3. **Analyze the existing code architecture:**
   - Identify the involved modules and package structure.
   - Identify existing design patterns (layering, DI, data-access patterns).
   - Identify existing similar feature implementations to use as reference.

### Step 3: Write the Proposal

Generate the proposal following the template in `../_references/proposal-template-be.md`. Read that file first, then fill in each section.

The output is a single Markdown document.

**Language:** write the proposal in the same language as the PRD/requirement input, or the language the repository's other docs already use; default to English if neither gives a clear signal. Code, DDL, and technical identifiers stay in their original form regardless.

#### Key Principles

- Every design decision states a reason (why this approach?).
- Assumptions are explicit (e.g., "assumes peak QPS < 5000").
- Success criteria are verifiable (e.g., "P99 < 200ms", not "good performance").
- Change points include a "current approach → new approach" comparison with code.
- All DDL is complete (`CREATE TABLE` with columns, indexes, comments).
- All new APIs have full request/response JSON definitions.

#### Diagrams

- **UML diagrams** (architecture, sequence, activity, class): use PlantUML syntax in fenced ```plantuml code blocks.
- **Simple structural diagrams** (directory trees, data flow, component relationships): use ASCII art.
- Prefer diagrams over long text for system interactions and flows.

### Step 4: Self-Review

After writing, run this checklist:

**1. Requirement coverage**
- Check each functional point in the PRD; each must have a corresponding design in the proposal.
- List and fill any gaps.

**2. Scope reduction scan**
- Search the proposal for phasing/deferral language: MVP, Phase 2, staged rollout, later iteration, simplified version, core-only, P0-only.
- Every hit must trace to an explicit user instruction recorded in the proposal; otherwise design the missing scope now.

**3. Placeholder scan**
- Search for: TBD, TODO, "to be determined", "to be added later", "similar to", "refer to".
- Replace all with concrete content.

**4. Template completeness**
- Every section has substantive content.
- The data model has complete DDL.
- APIs have complete request/response definitions.
- The risk table has at least 2 risk items.
- The `Repositories Involved:` field is present (repo list from Step 1; multi-repo routing depends on it).

**5. Consistency check**
- Class names, method names, and table names are consistent throughout.
- Modules in architecture diagrams match those in the detailed design.

**6. PlantUML validation**
- For each PlantUML diagram, render it via a PlantUML server — the public instance at `https://www.plantuml.com/plantuml`, or a local/self-hosted renderer if the project configures one — by encoding the source and requesting `/png/{encoded}` or `/svg/{encoded}`.
- Verify the rendered image has no syntax-error text.
- If your environment doesn't support image inspection, skip this step.

Fix any issues found immediately, then continue.

### Step 5: Independent Review (if subagents are available)

If your tool supports spawning a subagent with fresh context:

- Spawn an independent review agent with:
  - Input: the generated proposal Markdown file.
  - Reference: `../_references/proposal-writing.md` (quality-standards checklist).
  - Task: review the proposal against every checklist item and report issues.
- The review agent must not have seen the generation process — fresh context is what makes the review independent.
- Fix any issues the reviewer finds before proceeding to output.

If subagents aren't available, skip this step — the Step 4 self-review is sufficient.

### Step 6: Output

Write the proposal as a Markdown file to the `docs/proposals/` directory in the repository:

- File name format: `YYYY-MM-DD-<feature-name>.md`
- Example: `docs/proposals/2026-05-09-order-refund-flow.md`
- Create the `docs/proposals/` directory if it doesn't exist.

### Step 7: Execution Handoff

After output, present next-step options to the user:

```
Proposal generated and saved to docs/proposals/. Suggested next steps:

1. ss-build-plan on docs/proposals/<file>.md — break the proposal into an executable task plan; Phase 0 automatically generates OpenSpec delta specs
2. ss-multi-agent-coding — start multi-agent parallel coding (for smaller requirements)
3. Manual review — have the team review the proposal first

Which do you prefer?
```
