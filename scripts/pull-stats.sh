#!/usr/bin/env bash
# Pulls per day, from the hourly totals the track-pulls workflow records on
# the `stats` branch. Each day is its last recorded total minus the previous
# day's, so the first day only shows up once there is a day before it.
#
#   scripts/pull-stats.sh          # every recorded day
#   scripts/pull-stats.sh 14       # the last 14 days
#
# The numbers include this repository's own pulls (daily scans, publish runs).
set -euo pipefail

url=https://raw.githubusercontent.com/nvitaterna/nodejs-distroless/stats/pulls.csv
days=${1:-0}

curl -fsSL "$url" | awk -F, -v days="$days" '
  NR == 1 { next }
  {
    day = substr($1, 1, 10)
    if (!(day in seen)) { seen[day] = 1; order[++n] = day }
    # a blank count means that registry could not be read; keep the last one
    if ($2 != "") hub[day] = $2
    if ($3 != "") ghcr[day] = $3
  }
  END {
    printf "%-10s  %10s  %8s  %8s\n", "date (UTC)", "docker hub", "ghcr", "total"
    first = (days > 0 && n - days + 1 > 2) ? n - days + 1 : 2
    for (i = first; i <= n; i++) {
      d = order[i]; p = order[i - 1]
      h = (d in hub && p in hub) ? hub[d] - hub[p] : "?"
      g = (d in ghcr && p in ghcr) ? ghcr[d] - ghcr[p] : "?"
      t = (h == "?" || g == "?") ? "?" : h + g
      partial = (i == n) ? "  (so far)" : ""
      printf "%-10s  %10s  %8s  %8s%s\n", d, h, g, t, partial
    }
  }'
