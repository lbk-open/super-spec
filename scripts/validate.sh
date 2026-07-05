#!/usr/bin/env bash
# Repository validation — run locally before pushing, and in CI on every PR.
# Checks manifests, skill structure, cross-file contracts, and doc consistency.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 <<'PY'
import json, pathlib, re, sys

failures = []
def fail(msg): failures.append(msg)

# 1. Manifests are valid JSON
manifests = [
    ".claude-plugin/plugin.json",
    ".claude-plugin/marketplace.json",
    ".codex-plugin/plugin.json",
    ".agents/plugins/marketplace.json",
    "package.json",
]
data = {}
for m in manifests:
    try:
        data[m] = json.loads(pathlib.Path(m).read_text())
    except Exception as e:
        fail(f"{m}: invalid JSON ({e})")

# 2. Version is in sync across the three plugin manifests
versions = {m: data[m].get("version") for m in
            (".claude-plugin/plugin.json", ".codex-plugin/plugin.json", "package.json")
            if m in data}
if len(set(versions.values())) > 1:
    fail(f"version mismatch: {versions}")

# 3. Every skill directory is well-formed
skill_dirs = sorted(p for p in pathlib.Path("skills").iterdir()
                    if p.is_dir() and p.name.startswith("ss-"))
for d in skill_dirs:
    f = d / "SKILL.md"
    if not f.exists():
        fail(f"{d}: missing SKILL.md")
        continue
    m = re.match(r"\A---\n(.*?)\n---\n", f.read_text(), re.S)
    if not m:
        fail(f"{f}: missing frontmatter")
        continue
    fm = m.group(1)
    keys = re.findall(r"^([A-Za-z-]+):", fm, re.M)
    if sorted(keys) != ["description", "name"]:
        fail(f"{f}: frontmatter keys {keys}, expected exactly [name, description]")
    name = re.search(r"^name:\s*(\S+)\s*$", fm, re.M)
    if not name or name.group(1) != d.name:
        fail(f"{f}: frontmatter name does not match directory name")
    desc = re.search(r"^description:\s*(.+)", fm, re.M | re.S)
    if desc and len(desc.group(1)) > 1024:
        fail(f"{f}: description exceeds 1024 characters")

# 4. Skill count matches what INSTALL.md asserts
expected = re.findall(r"expected: (\d+)", pathlib.Path("INSTALL.md").read_text())
for e in expected:
    if int(e) != len(skill_dirs):
        fail(f"INSTALL.md expects {e} skills, found {len(skill_dirs)}")

# 5. Sibling relative references resolve
ref_re = re.compile(r"\.\./(ss-guardrails|_references)/[A-Za-z0-9._-]+\.md")
for f in pathlib.Path("skills").rglob("*.md"):
    for ref in sorted({m.group(0) for m in ref_re.finditer(f.read_text())}):
        if not (pathlib.Path("skills") / ref[3:]).exists():
            fail(f"{f}: dangling reference {ref}")

# 6. Cross-file interface contracts
contracts = [
    ("**Repositories Involved:**",
     ["skills/_references/multi-repo-detection.md", "skills/_references/proposal-template.md"]),
    ("**Repositories Requiring Fix:**",
     ["skills/_references/multi-repo-detection.md", "skills/ss-inspect/SKILL.md"]),
    ("---SS-RESULT---",
     ["skills/ss-coding-workflow/SKILL.md", "skills/ss-multi-repo-workflow/SKILL.md"]),
]
for token, files in contracts:
    for fp in files:
        if token not in pathlib.Path(fp).read_text():
            fail(f"{fp}: missing interface contract token {token!r}")

# 7. English-only guard (CJK) for distributed content: skills/, docs/, INSTALL.md.
#    README.md (language switcher) and AGENTS.md (a CJK formatting example) are exempt.
cjk = re.compile(r"[一-鿿]")
scope = list(pathlib.Path("skills").rglob("*.md")) + list(pathlib.Path("docs").rglob("*.md")) \
      + [pathlib.Path("INSTALL.md")]
for f in scope:
    if cjk.search(f.read_text()):
        fail(f"{f}: contains CJK characters (English-only outside README.zh-CN.md)")

if failures:
    print("\n".join("FAIL: " + f for f in failures), file=sys.stderr)
    sys.exit(1)
print(f"OK: {len(skill_dirs)} skills, manifests valid, version {next(iter(versions.values()))!r} in sync")
PY

if command -v claude >/dev/null 2>&1; then
  claude plugin validate .
else
  echo "note: claude CLI not found — skipped Claude plugin manifest validation"
fi
