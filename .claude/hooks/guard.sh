#!/usr/bin/env bash
# PreToolUse guard for the two mechanical mistakes that have actually bitten
# this repo before:
#
#   1. A full-file `Write` to prisma/schema.prisma. The schema is ~9k lines and
#      has been silently truncated by a rewrite; it must only ever be edited
#      surgically. Force `Edit`.
#   2. A `git push` that targets `main`. Work happens on feature branches; main
#      is protected by convention, and an agent should never push it directly.
#
# The hook reads the tool call as JSON on stdin. Exit 0 allows the call; exit 2
# blocks it and shows the message to the model. Anything the guard does not
# recognise is allowed — it fails open on purpose, so a parsing hiccup can never
# wedge a session.
set -euo pipefail

input="$(cat)"

python3 - "$input" <<'PY'
import json, re, sys

try:
    data = json.loads(sys.argv[1])
except Exception:
    sys.exit(0)  # unparseable -> allow

tool = data.get("tool_name", "")
ti = data.get("tool_input", {}) or {}

def block(msg: str):
    print(msg, file=sys.stderr)
    sys.exit(2)

# 1. Never Write (full rewrite) the Prisma schema.
if tool == "Write":
    path = str(ti.get("file_path", ""))
    if path.replace("\\", "/").endswith("prisma/schema.prisma"):
        block(
            "Refusing Write to prisma/schema.prisma: it must be edited "
            "surgically with Edit, never rewritten wholesale (a full Write has "
            "truncated it before). Use Edit, then run "
            "`pnpm --filter api db:generate`."
        )

# 2. Never git push to main. Only a command *segment* that actually invokes
# `git push` targeting main is blocked — not a segment that merely mentions the
# string (an echo, a grep, a heredoc, a commit message), which starts with some
# other command. Feature branches with "main" inside a longer name
# (e.g. `maintenance-x`) are not matched.
if tool == "Bash":
    cmd = str(ti.get("command", ""))
    for segment in re.split(r"[;&|\n]+", cmd):
        s = segment.strip()
        # drop leading env-var assignments (FOO=bar git push ...)
        while re.match(r"^\w+=\S*\s+", s):
            s = s.split(None, 1)[1] if " " in s else ""
        if not re.match(r"^git\s+(-\S+\s+|--\S+(=\S+)?\s+)*push\b", s):
            continue
        if re.search(r"(\s|:)(HEAD:)?main(\s|$)", s):
            block(
                "Refusing to push to main. Push to the feature branch instead "
                "and open a PR; main is not a direct-push target."
            )

sys.exit(0)
PY
