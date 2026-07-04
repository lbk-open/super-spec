---
name: ss-write-proposal-fe
description: Use when you have a PRD or requirement description and need a complete frontend technical proposal before writing any code. Filters the requirement down to this app's boundary, analyzes existing navigation/state/component conventions across Web, iOS, Android, or Flutter, and produces a Markdown proposal covering every page state — gated by a self-review and, when available, an independent reviewer pass.
---

# Write Frontend Technical Proposal

Generate a comprehensive frontend technical proposal from a PRD or requirement description.

**When not to use:**
- Small bug fixes or style-only changes with no architecture decisions.
- One-line code changes or copy fixes.
- Changes already fully specified in an existing proposal.

**Announce at the start:** "Using the ss-write-proposal-fe skill to generate the frontend technical proposal."

## Inputs

- A link to a requirement document that your document-reading tool can fetch, or a plain-text requirement description. If neither is available, ask the user for one.

If the input is a document link, read its content with whatever document-reading tool is available in your environment. Otherwise treat the input as a plain-text requirement description directly.

## Hard Gates

Before writing, verify each item. If any fails, stop and explain to the user:

- [ ] The PRD/requirement input is readable (the link is accessible, or the text description is substantive).
- [ ] The input contains concrete page/feature requirements, not just a concept document.
- [ ] The current repository is a frontend project — Web (`package.json` / `tsconfig.json`), iOS (`*.xcodeproj` / `Podfile` / `Package.swift`), Android (`AndroidManifest.xml` / an Android `build.gradle`), or Flutter (`pubspec.yaml`). Identify the platform from the codebase and apply that stack's conventions.

If requirements are vague about page interactions, ask the user for clarification — never assume user flows silently.

## Anti-Patterns

The following are proposal failures — never allowed:

| Anti-Pattern | Correct Approach |
|-------------|-----------------|
| Copy-pasting large sections of the PRD/design descriptions | Include only the context needed for tech decisions |
| Component design lists names without responsibilities | Each component specifies: input props, internal state, exposed events |
| State management just names a library ("use Redux/Pinia/Bloc/a ViewModel") | Provide the actual state structure definition (fields + types) |
| API integration only lists endpoints without timing | Specify request timing, cache strategy, and error handling |
| Only covering the happy path | List every page state: Loading / Empty / Error / Edge Case |
| Placeholders: TBD, TODO, "to be determined", "fill in later" | Complete every section immediately; ask the user if stuck |
| Unilaterally splitting delivery into "Phase 1 / Phase 2," designing only "P0 / core" pages, or proposing an MVP/demo/simplified version | Cover 100% of the PRD's pages, features, and interaction states; phasing or scope cuts only on an explicit user instruction, recorded in the proposal |
| Silently narrowing scope to route around a blocker (missing design assets, unclear interaction, external dependency) | Stop and ask the user; a document split (Step 1) reorganizes delivery — every split proposal still gets written, nothing is cut |
| Introducing unnecessary new dependencies/frameworks | Prefer the existing tech stack and component library |
| "While we're at it" refactoring of unrelated pages/components | Only changes within the requirement's scope |
| Describing UI without state/data flow | Include store structure, request timing, error handling |
| Skipping interaction states shown in the design | Cover hover / active / disabled / loading / error states when the design provides them |

## Process

### Step 1: Scope Check & App Boundary

After reading the PRD, identify what's relevant to **this repository/app**:

1. **Identify this app's role.** Read `APPLICATION.md` (if it exists) or analyze the codebase to understand what this frontend app is responsible for.
2. **Extract the relevant scope from the PRD.** A PRD typically spans multiple services and frontends. Filter out only the parts that belong to this app.
3. **Define the app boundary.** Clearly identify:
   - What this app WILL implement (in-scope pages/features)
   - What belongs to other apps (out-of-scope, marked as external)
   - Integration points (APIs to consume, cross-app navigation, shared components)
4. **Record the repository list.** The proposal MUST carry a structured field, **`Repositories Involved:`**, in its summary-design section — every repository whose code must change for this requirement (write the current repo's name if it's single-repo). Do not count a shared API-contract repo or spec submodules. Downstream workflows read this field for multi-repo routing — see `../_references/multi-repo-detection.md`.

If the in-scope work involves **5+ independent pages** or **spans 2+ sub-apps/micro-frontend modules**:
- Suggest splitting into multiple independent proposals.
- Each proposal should be independently deliverable and verifiable.
- Confirm the split approach with the user before continuing.

If the requirement is focused, proceed.

### Step 2: Context Gathering

1. **Read the PRD/requirement** using the method decided in Inputs above, focusing on user operation flows.
2. **Parse related documents.** Read the linked issue/task, PRD, backend technical proposal, and design links if present; extract scope, terms, dependencies, and interaction constraints.
3. **Discover API definitions.** Search the repository for OpenAPI YAML files. If found, extract the relevant data structures.
4. **Analyze the existing frontend architecture** by inspecting the codebase directly:
   - Navigation/route structure (pages / views / screens / navigator)
   - State management approach (Web: Vuex/Pinia/Redux/Zustand · iOS: MVVM/Combine/TCA · Android: ViewModel/LiveData/Compose state · Flutter: Provider/Riverpod/Bloc)
   - UI building blocks (component library / design system / native views / widgets)
   - API/data-access patterns (Web: axios/SWR/React Query · iOS: URLSession/Alamofire · Android: Retrofit/OkHttp · Flutter: dio/http)
5. **Discover linked designs.** If the PRD references a Figma (or similar design-tool) URL and you have a way to read it, fetch:
   - Page list and navigation relationships between pages
   - Component hierarchy
   - Interaction states (hover/active/disabled/error, etc.)

### Step 3: Write the Proposal

Generate the proposal following the template in `../_references/proposal-template-fe.md`. Read that file first, then fill in each section.

The output is a single Markdown document using the template's sections exactly:

1. Background
2. Terminology
3. Related Documents
4. Summary Design
5. Backend API Dependencies
6. Technical Implementation Details
7. User Story Breakdown
8. Risk Assessment
9. Testing Recommendations
10. Rollback / Observability / Version Compatibility

**Language:** write the proposal in the same language as the PRD/requirement input, or the language the repository's other docs already use; default to English if neither gives a clear signal. Code and technical identifiers stay in their original form regardless.

#### Key Principles

- Every section has substantive content — no placeholders.
- Every component specifies its props interface and exposed events.
- Every page covers 5 states: Normal / Loading / Empty / Error / Edge Case.
- Data structures align with backend API responses (field names and types match).
- Assumptions are explicit (e.g., "assumes data volume < 10k rows").
- Design decisions state why that approach was chosen.
- Diagrams are used for architecture, flow, and navigation when helpful.

#### Diagrams

- **UML diagrams** (component hierarchy, sequence, navigation flow): use PlantUML syntax in fenced ```plantuml code blocks.
- **Simple structural diagrams** (directory trees, component trees, data flow): use ASCII art.
- Prefer diagrams over long text for component relationships and user flows.

### Step 4: Self-Review

After writing, run this checklist:

**1. Requirement coverage**
- Check each page and feature in the PRD; each must have a corresponding design.
- If a design was provided, verify every page in it has a corresponding component design and interaction-state mapping.
- List and fill any gaps.

**2. Scope reduction scan**
- Search the proposal for phasing/deferral language: MVP, Phase 2, staged rollout, later iteration, simplified version, core-only, P0-only.
- Every hit must trace to an explicit user instruction recorded in the proposal; otherwise design the missing scope now.

**3. Placeholder scan**
- Search for: TBD, TODO, "to be determined", "to be added later", "similar to", "refer to".
- Replace all with concrete content.

**4. State coverage**
- Every page/component has defined handling for Loading/Empty/Error states.
- Form components have validation logic specified.

**5. Consistency check**
- Component names are consistent throughout.
- API endpoint names match backend definitions.
- Store field names match usage in components.
- The `Repositories Involved:` field is present (repo list from Step 1; multi-repo routing depends on it).

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
- Example: `docs/proposals/2026-05-09-user-profile-redesign.md`
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
