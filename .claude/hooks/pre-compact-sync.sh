#!/usr/bin/env bash
# PreCompact hook: make the durable records get updated BEFORE the transcript
# that justifies them is thrown away.
#
# Compaction is lossy by design. Everything worth keeping has to be in a file
# first, and in practice it only got there because the user remembered to ask —
# every time. This hook asks instead.
#
# It blocks a MANUAL /compact (exit 2, message shown to the model), which hands
# control back so the records can be brought level. The retry that follows —
# any /compact within the next half hour — goes through unconditionally, so this
# can nag but can never wedge: the escape is simply to run the command again.
#
# Auto-compaction is blocked ONLY when there is room to spare, and never
# otherwise. Left at its default, Claude Code compacts when the conversation
# reaches the model's context limit — refusing it there would strand the session
# at the wall with no way out, which is why this hook used to ignore auto
# entirely.
#
# Setting `autoCompactWindow` below the model's window changes that, and it is
# the whole reason this branch exists. At 700k on a 1M-token model, auto-compact
# fires with 300k still free: ample room to run the records pass and let the
# retry through. So the interlock is the setting itself — no reduced window, no
# blocking. Remove the setting and this hook silently goes back to never
# touching auto, with nobody needing to remember to disarm it.
#
#   /autocompact 700k     (writes autoCompactWindow to your user settings)
#   /autocompact auto     (back to the model's tuned window; auto stops being blocked)
#
# Fails open in every other respect — unparseable input, unwritable stamp
# directory, anything unexpected — because a hook that breaks a session is worse
# than a hook that misses a reminder.
set -uo pipefail

input="$(cat 2>/dev/null || true)"

python3 - "$input" <<'PY'
import json, os, sys, tempfile, time

try:
    data = json.loads(sys.argv[1]) if sys.argv[1].strip() else {}
except Exception:
    sys.exit(0)  # unreadable -> allow

# The field naming has moved around between versions; accept either, and treat
# an absent trigger as "auto" so an unknown shape takes the cautious branch.
trigger = (
    data.get("trigger")
    or data.get("compaction_trigger")
    or data.get("hookSpecificOutput", {}).get("trigger")
    or "auto"
)


def reduced_window() -> int:
    """The configured auto-compact window in tokens, or 0 when none is set.

    Read in the same precedence Claude Code uses: the environment variable wins,
    then the settings files from most specific to least. Anything unreadable
    counts as "not set", which disarms the auto branch — the safe direction.
    """
    raw = os.environ.get("CLAUDE_CODE_AUTO_COMPACT_WINDOW")
    if raw and raw.strip().isdigit():
        return int(raw.strip())

    project = os.environ.get("CLAUDE_PROJECT_DIR", "")
    home = os.path.expanduser("~")
    for path in (
        os.path.join(project, ".claude", "settings.local.json"),
        os.path.join(project, ".claude", "settings.json"),
        os.path.join(home, ".claude", "settings.json"),
    ):
        try:
            with open(path, encoding="utf-8") as handle:
                value = json.load(handle).get("autoCompactWindow")
            if isinstance(value, int) and value > 0:
                return value
        except Exception:
            continue
    return 0


if trigger != "manual":
    # Blocking auto-compaction is only safe with headroom below it, and the
    # only evidence of headroom available here is a window set well under the
    # smallest model window this repo runs against (1M). Above the ceiling —
    # or unset — auto is left alone, exactly as before.
    HEADROOM_CEILING = 800_000
    window = reduced_window()
    if window == 0 or window > HEADROOM_CEILING:
        sys.exit(0)

# Explicit opt-out: `/compact skip-sync`.
instructions = (data.get("custom_instructions") or "").lower()
if "skip-sync" in instructions or "nosync" in instructions:
    sys.exit(0)

# The stamp is what makes this ask once instead of every time — but it has to
# expire. A session here runs for days and compacts several times, and a stamp
# that never ages turns "ask once per compaction" into "ask once, ever": the
# second compaction, a day later, discards an entirely new window of work
# without ever asking. It did exactly that on 2026-09-04. So the stamp silences
# only the RETRY the model just asked the user for; anything later asks again.
RETRY_WINDOW_SECONDS = 30 * 60

session = str(data.get("session_id") or "unknown")
stamp_dir = os.path.join(tempfile.gettempdir(), "claude-precompact-sync")
stamp = os.path.join(stamp_dir, session)

try:
    os.makedirs(stamp_dir, exist_ok=True)
    if (
        os.path.exists(stamp)
        and time.time() - os.path.getmtime(stamp) < RETRY_WINDOW_SECONDS
    ):
        sys.exit(0)          # this IS the retry we asked for -> let it through
    open(stamp, "w").close()
    os.utime(stamp, None)    # a later compaction must age out of the window
except Exception:
    sys.exit(0)              # cannot track state -> never block

sys.stderr.write(
    f"Compaction paused once ({trigger}), on purpose: the transcript is about "
    "to be discarded and only files survive it.\n\n"
    "Run the `sync-records` skill now and carry out its pass. Correcting a "
    "memory that this session made WRONG matters more than adding a new one — "
    "a stale memory is trusted, a missing one is merely absent.\n\n"
    "Then tell the user it is level and to run /compact again; the retry is "
    "never blocked. If nothing changed, say so plainly instead of inventing "
    "an edit.\n\n"
    "To skip deliberately: /compact skip-sync\n"
)
sys.exit(2)
PY
