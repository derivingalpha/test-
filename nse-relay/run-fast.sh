#!/bin/sh
# Fast relay for the HSL IT Tracker (macOS / Linux): see run-fast.cmd. Needs Node.js 18 or later.
cd "$(dirname "$0")"
[ -n "$RELAY_KEY" ] || { printf 'Tracker admin password: '; stty -echo; read RELAY_KEY; stty echo; echo; export RELAY_KEY; }
exec node relay.mjs --out "${TMPDIR:-/tmp}/nse-relay-latest.json" --loop "${EVERY:-5}" --post https://bse-it-tracker.onrender.com/api/nse-relay
