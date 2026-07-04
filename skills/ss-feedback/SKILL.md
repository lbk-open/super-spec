---
name: ss-feedback
description: Use when any super-spec skill fails, misbehaves, or the user expresses frustration with it — or when the user directly asks to send feedback. Asks exactly one question (a one-line description of the problem), silently gathers the rest of the context itself, and files a GitHub issue.
---

# Send Feedback

## Core principle

Ask the user exactly **one** question — a one-line description of the problem. Everything else is collected, inferred, and filed automatically.

## When to use

**Proactively:** if a super-spec skill fails or errors out, or the user expresses dissatisfaction, ask: "Want me to file this as feedback?" If they say yes, run the flow below.

**On request:** the user asks to send feedback, with or without a description already attached.

## Configuration

This skill files issues against a single repository, defined here for maintainers to update:

```
FEEDBACK_REPO="https://github.com/liyue2008/super-spec"
```

If you're maintaining a fork or a different feedback tracker, change this value — nothing else in this skill needs to change.

## Step 1 — Get the problem description

- If the user already gave a description when invoking this skill, use it as-is — don't ask again.
- Otherwise, ask exactly one question: "One line describing the problem?"
- If this was triggered proactively (a skill errored), summarize the problem from the conversation and confirm: "I'll file this feedback: [summary] — sound right?"

Do not ask any other question.

## Step 2 — Collect context (silently)

```bash
uname -sm
# your coding assistant's own version command, if it has one
git remote get-url origin 2>/dev/null
```

Do not collect or transmit anything beyond basic OS info, the assistant's version, and the repository's remote URL — no telemetry, no usage analytics, no session data.

## Step 3 — Infer the rest from conversation context

- **Which skill was involved** — infer from the conversation (e.g., "`ss-build-plan`"); if unclear, write "unprompted feedback."
- **Reproduction steps** — extract the operation sequence from the conversation if it's clear; omit this section if it isn't.
- **Error output** — if the conversation contains an error, excerpt the relevant part (no more than 50 lines).

## Step 4 — Create the issue

```bash
gh issue create \
  --repo "<owner>/<repo>"   # parsed from FEEDBACK_REPO above \
  --title "[Feedback] <one-line description>" \
  --body "<assembled body, see template below>" \
  --label "feedback"
```

If `gh` isn't authenticated, tell the user directly: run `gh auth login` first, then retry.

## Step 5 — Report the outcome

```
Filed: <issue-url>
```

If creation fails for any reason (permissions, network, label doesn't exist), give the user a direct link to open the issue manually instead: `<FEEDBACK_REPO>/issues/new`.

## Issue body template

```markdown
## Problem

<user's one-line description>

## Skill involved

<inferred skill name, or "unprompted feedback">

## Error output

<excerpted from context; omit this section if there is none>

## Reproduction steps

<extracted from context; omit this section if there is none>

## Environment

- OS: <uname -sm>
- Assistant: <version, if available>
- Project remote: <git remote — no sensitive info>
```

## Anti-patterns

| Don't | Do instead |
|-------|------------|
| Ask "what's the expected behavior?" | Infer it from context; omit if you can't |
| Ask "how do I reproduce this?" | Extract the operation sequence from context |
| Ask "should I include project info?" | Include the git remote directly — it has nothing sensitive in it |
| Ask "what label should this get?" | Default to `feedback` |
| Wait for the user to approve the body text | File it directly — it can be edited on GitHub afterward |
