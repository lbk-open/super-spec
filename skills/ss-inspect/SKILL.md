---
name: ss-inspect
description: Use when investigating any technical issue — a bug, an alert, a performance regression, or unexpected behavior — that needs a rigorous, evidence-based root-cause analysis rather than a guess. Runs a six-phase process that gathers corroborating evidence from multiple independent sources (alerts, metrics, logs, traces, code history, configuration) before any fix is proposed, and produces a structured investigation report.
---

# Root Cause Investigation

Systematically investigate and resolve technical issues by gathering evidence from multiple independent sources, tracing the root cause through the full call chain, and verifying the fix before shipping it. Never guess — follow the evidence.

**Core principle:** always establish root cause before attempting a fix. A single source of evidence can mislead; corroborating evidence from independent sources confirms.

## When to use

Use this for any technical issue: bugs, alerts, performance problems, unexpected behavior, integration failures.

Use it *especially* when:
- You're under time pressure — guessing under pressure is what makes incidents drag on; being systematic is faster, not slower.
- "Just restart it" looks like the easy fix.
- A previous fix attempt didn't work.
- You don't yet fully understand the issue.
- Different people have different theories about the cause.

Don't skip it because the issue looks simple (simple bugs have root causes too), because you're in a hurry (rushing guarantees rework), or because someone suggests "just try X" (guessing costs more time than investigating).

## The iron law

```
NO FIX WITHOUT A ROOT CAUSE CONFIRMED BY EVIDENCE FROM 2+ INDEPENDENT SOURCES
```

If you haven't gathered corroborating evidence from at least two independent sources (e.g., logs + traces, metrics + code), you cannot propose a fix.

**One variable at a time.** When testing a hypothesis, make the smallest possible change. Never change multiple things at once — you won't know which one worked.

**Emergency exception.** For an active, high-severity incident, an emergency mitigation (rollback, config revert, feature-flag toggle) to stop the impact is allowed before root cause is fully confirmed. Mitigation does not replace investigation — complete the full six-phase process afterward regardless.

## Inputs

Ask for (or infer from context) whichever of these is available:
- An issue link, alert ID, or a plain-language description of the symptom.
- The application/service name, if not obvious from the current repository.
- The environment (local, test, staging, production) and rough timeframe the issue started.

If none of this is clear, do not start investigating — go to Phase 1 and ask the user to pin it down.

## Prerequisite: do you need runtime environment access?

Pure code analysis does **not** need environment access:
- The bug reproduces locally (failing test, logic error, compile error).
- The issue is purely in code logic (wrong condition, type error, off-by-one).
- A stack trace points to a clear code path with no external dependency.
- The issue can be reproduced and fixed with unit tests alone.

Runtime investigation **does** need environment access when:
- The issue involves an external call (database, cache, queue, downstream service).
- It only reproduces in a deployed environment, not locally.
- You need logs, traces, metrics, or alert history.
- You need to inspect or compare runtime configuration.
- The error references network, timeout, or connection failures.

If you need environment access: check whether `APPLICATION.md` exists at the project root.
- If yes, read it for server addresses, configuration-center access, middleware endpoints, and observability tooling.
- If no, run the `ss-explore-environment` skill first. You cannot troubleshoot a runtime issue you have no access into.

## The six phases

Complete each phase before moving to the next.

### Phase 1 — Understand the problem

**Gate: do not start investigating until you can state the problem precisely.**

1. Read every error message and stack trace completely — they usually contain the answer. Note file paths, line numbers, error codes, exception types. Copy the exact error text for later searching.
2. Define the symptom: what is happening (exact error/behavior/metric), when did it start (timestamp, deploy, config change), where does it happen (which environment, API, user segment), how often (always, intermittent, under specific conditions).
3. Determine scope and impact: how many users/requests are affected, is it ongoing or resolved, which services are involved.
4. Write one sentence: "I need to find out why [specific symptom] is happening in [specific context] since [specific time]."

If any of this is unclear, ask the user — do not assume.

### Phase 2 — Gather evidence from multiple sources

Collect evidence from every available source in parallel; do not stop at the first clue.

For a relative timeframe, start with a window matching when the issue began (e.g., "30 minutes ago", "6 hours ago", "7 days ago") and widen it if a source returns nothing.

If a query against one of your platforms returns nothing: widen the timeframe once; if still empty, record "no data in this range for this source" and move on. If a tool itself errors (missing, unauthorized), stop and tell the user which access is needed — do not silently skip it.

For a pure code issue with no runtime component: skip the alerts/metrics/logs/traces sources below and go straight to git and code history — use `git bisect` to isolate the breaking commit, `git blame` on the suspect lines, search commit history for similar past bugs, and read related tests. Success criteria: evidence from two or more code-level angles (history + reading + test output).

Evidence sources to check in parallel:

**Alerts.** What alerted, when, and what threshold was breached? Query your alerting system for events on this app/service in the relevant timeframe, then pull the detail of the specific alert.

**Metrics.** Quantify the problem: error rate and error-type distribution, request rate and latency (p50/p95/p99), host resource usage (CPU, memory), and runtime-level metrics (GC pauses, heap usage) if applicable. Look for an inflection point that lines up with the symptom's start time.

**Logs.** Search by error level and by keyword in the same timeframe; correlate a specific error with its trace ID if your logging platform supports it; pull the surrounding context around a specific log line. What exception was thrown, with what stack trace, on what input?

**Traces.** List traces that errored or were unusually slow in the timeframe, then expand a representative trace's full span tree. Where in the call chain does it break? Which downstream call, database query, or cache operation is implicated?

**Code and git history.** `git log --since="<timeframe>" -- <relevant-paths>` for recent changes that could cause this; grep the codebase for the literal error message text to find where it's raised.

**Configuration.** Did a configuration value or feature flag change around the same time? Compare the current value in your configuration center (or config files) against what you'd expect. Note: never paste live configuration values that might contain secrets into any report — reference where to look instead.

Correlate everything you found across sources before moving on.

### Phase 3 — Pattern analysis

Before forming a hypothesis, find the pattern:

1. **Find working examples.** Locate similar requests/flows that succeed. Find the same endpoint working for other users or parameters.
2. **Compare working vs. broken.** Same code path? Same config? Same environment? List every difference, however small — don't assume something "can't matter."
3. **Check recent changes.** Code changes, configuration changes, deployments, and infrastructure changes (scaling, migrations) around the issue's start time.
4. **Understand the dependency chain.** What does this code path depend on (database state, cache, downstream service, config value), and which dependency could produce this specific failure mode?

If you can say "it works HERE but fails THERE," that difference is your lead.

### Phase 4 — Correlate and form a hypothesis

1. **Reconstruct the timeline.** Chronological sequence of what happened first, second, third. Line up the metric spike, the log errors, and the trace failures on one timeline.
2. **Build an evidence table:**

   | Source | Finding | Supports hypothesis? |
   |--------|---------|----------------------|
   | Alerts | ... | yes / no / partial |
   | Metrics | ... | yes / no / partial |
   | Logs | ... | yes / no / partial |
   | Traces | ... | yes / no / partial |
   | Code | ... | yes / no / partial |
   | Config | ... | yes / no / partial |

3. **State the hypothesis:** "Root cause is [X], because evidence from [source A] shows [Y] and evidence from [source B] confirms [Z]." Rate confidence: HIGH (3+ sources agree), MEDIUM (2 sources agree), LOW (single source). **If confidence is LOW, go back to Phase 2 — do not proceed with a low-confidence fix.**
4. **Rule out alternatives.** For every plausible alternative explanation, state why the evidence contradicts it.

### Phase 5 — Verify the hypothesis

Before fixing anything, verify:

1. **Reproduce it** if at all possible — trigger the issue in a test environment, or find another trace showing the same pattern.
2. **Predict.** If the hypothesis is correct, what else should be true? Check whether the evidence supports that prediction.
3. **Counter-test.** If the hypothesis is correct, what should *not* be happening? Confirm it indeed isn't.

If verification fails, the hypothesis is wrong — return to Phase 2.

### Phase 6 — Fix and confirm

Only once the hypothesis is verified with HIGH confidence:

1. **Choose the fix type:** immediate mitigation (config change, rollback, feature-flag toggle) to stop the bleeding, or a root-cause fix (permanent code change).
2. **For immediate mitigation:** apply the smallest change that stops the impact, document what changed and why, and open a follow-up task for the permanent fix.
3. **For a root-cause fix:** write a failing test that reproduces the issue, implement the fix (delegate complex fixes to the `ss-multi-agent-coding` skill), and verify: test passes, metrics recover, logs are clean.
4. **Post-fix verification:** confirm the error rate has dropped, no new errors appear in logs, and traces are clean over the following period.

**Fixing discipline applies throughout:** change one thing at a time; if a fix doesn't work, return to Phase 2 with the new information and form a new hypothesis — never stack a second fix on top of a failed one.

**Three failed fixes is a stop sign, not a retry sign.** If three fix attempts have failed:
- Your understanding of the system may be fundamentally wrong, the problem may be architectural rather than a point bug, or each fix is revealing new problems elsewhere (a symptom of a systemic issue).
- Stop attempting fixes. Document all three attempts and what each revealed. Tell the user: "Three fix attempts failed. Evidence suggests this is architectural/systemic. Recommend discussing the approach before continuing." Do not attempt a fourth fix without explicit direction.

## Output: investigation report

Whether or not a fix was applied, produce a report:

```markdown
# Investigation Report: <one-line problem summary>

**Application:** <name>
**Environment:** <test / staging / production>
**Timeframe:** <issue timeframe>
**Date:** <YYYY-MM-DD>

## Problem statement
<Phase 1 sentence>

## Evidence chain

| Source | Finding | Relevance |
|--------|---------|-----------|
| Alerts | ... | ... |
| Metrics | ... | ... |
| Logs | ... | ... |
| Traces | ... | ... |
| Code | ... | ... |
| Config | ... | ... |

## Timeline
<chronological sequence>

## Root cause
**Root cause:** <clear statement>
**Confidence:** HIGH / MEDIUM
**Supporting evidence:** <2+ independent sources>
**Ruled out:** <alternative hypotheses and why>
**Repositories Requiring Fix:** <list; for a single-repo investigation, name that repo>

## Fix
**Immediate mitigation:** <applied / not needed>
**Root-cause fix:** <description / already merged>
**Verification:** <post-fix metrics/logs/traces>

## Prevention
- <additional alerting / monitoring / config guardrails>
- <defensive code changes>
```

## Quick reference

| Phase | Key activity | Success criteria |
|-------|--------------|-------------------|
| 1. Understand | Read errors, define the symptom, scope the impact | Problem statable in one precise sentence |
| 2. Gather evidence | Parallel collection across sources | Data from 3+ sources |
| 3. Pattern analysis | Find working examples, compare, check changes | Identified what differs between working and broken |
| 4. Correlate | Timeline, evidence table, hypothesis | Hypothesis backed by 2+ sources (HIGH confidence) |
| 5. Verify | Reproduce, predict, counter-test | Hypothesis confirmed or rejected |
| 6. Fix | Single change, one variable, verify recovery | Metrics/logs/traces confirm resolution |

## Signals you're going off the rails

| If you hear | It means | Do this |
|-------------|----------|---------|
| "Stop guessing" | You're proposing fixes without evidence | Return to Phase 2 |
| "Did you actually check?" | You assumed instead of verifying | Run the query, show the output |
| "That's not the issue" | Your hypothesis conflicts with their domain knowledge | Listen, ask what they know, re-analyze |
| "We already tried that" | You're repeating a failed approach | Ask what was tried and what it revealed |
| "Just show me the data" | Too much speculation, not enough evidence | Present raw evidence, let them interpret |

## When you don't know

It's fine to say "I don't understand this yet." Don't pretend to understand a system you haven't explored, and don't invent explanations to fill gaps. Say what specific context you're missing and ask for it. Saying "I don't know" is progress; guessing is not.

## When the investigation finds no root cause

If a systematic pass across all sources reveals no clear root cause:
1. That's a valid outcome, not a failure — as long as the process was actually completed.
2. Document what was investigated and ruled out.
3. Consider environmental or timing causes: a race condition, a transient network blip, an external dependency's own issue.
4. Add retry/circuit-breaker handling for transient failures, finer-grained monitoring, or structured logging at the suspected failure point to capture more data next time.
5. Report: "Root cause not definitively identified. Evidence suggests [environmental/timing/external]. Added [monitoring/retry] to capture more data on the next occurrence."

Before declaring this, double check: did you really check every source, and did you complete Phase 3's pattern analysis? Most "no root cause" conclusions are actually incomplete investigations.

## Anti-patterns

| Anti-pattern | Why it's harmful | Do this instead |
|--------------|-------------------|------------------|
| "Quick fix first, investigate later" | Masks the root cause, creates new bugs | Complete Phases 1–4 before fixing |
| Check only one source (e.g., only logs) | A single source can mislead | Require 2+ corroborating sources |
| Jump to a code fix without checking metrics/traces | May be an infra issue, not a code issue | Gather all evidence first |
| Assume the last deploy caused it | Correlation isn't causation | Check the metrics timeline against the deploy time |
| Fix the symptom, not the cause | The issue recurs | Trace to root cause via Phase 3 |
| Skip hypothesis verification | You may be fixing the wrong thing | Phase 5 is mandatory |
| Investigate without environment access | Can't gather real evidence | Get `ss-explore-environment` output first |
| Propose a fix at LOW confidence | Wastes time on the wrong fix | Require HIGH confidence (2+ sources) |

## Stop signs

Stop and back up if you catch yourself:
- Proposing a fix before completing Phase 2.
- Relying on a single source for root cause.
- Saying "probably" or "maybe" without evidence — that's a guess.
- Attempting a fourth fix after three failures.
- Investigating a runtime issue without environment access.
- Assuming without reproducing (skipping Phase 5).
- Skipping traces because "logs are enough" — traces show the *whole* chain.

## Common rationalizations

| Excuse | Reality |
|--------|---------|
| "Logs show the error clearly, no need for traces" | Logs show *what* happened; traces show *where* in the chain and *why* |
| "It's obviously a code bug" | A large share of "code bugs" are actually config/infra issues — check metrics and config too |
| "Just restart the service" | Restarting hides the issue; it will recur |
| "No time for a full investigation" | Systematic investigation is faster than thrashing through guesses |
| "Can't reproduce, so can't investigate" | Traces + logs + metrics from the incident *are* the reproduction |
| "Recent deploy caused it" | Verify with metrics — did the error start exactly at deploy time? |
| "Let me try one more fix" (after 2+ failures) | 3+ failures means an architectural problem — stop and discuss |
| "Multiple fixes at once saves time" | You can't isolate what worked — one variable at a time |

## Examples

```
Investigate: user login returns 500 in the staging environment
Investigate: alert #12345
Investigate: <link to the issue tracker item describing the bug>
```
