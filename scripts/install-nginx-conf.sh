#!/bin/sh
# Install the repo's nginx.conf onto this host and reload.
#
# The host runs nginx as a system service, not a container, so the config in
# this repo is not what is serving traffic until it is copied here. It exists
# as a script rather than a chained one-liner because the first attempt was a
# long `&&` chain: the backup ran, the copy silently did not, and every step
# after it was skipped without a visible error.
#
# Run with: sudo sh scripts/install-nginx-conf.sh
set -e

SRC="$(cd "$(dirname "$0")/.." && pwd)/nginx.conf"
DST=/etc/nginx/nginx.conf
BAK="$DST.bak-$(date +%Y%m%d-%H%M%S)"

[ -r "$SRC" ] || { echo "FAIL: cannot read $SRC"; exit 1; }

echo "1/5 validating $SRC"
nginx -t -c "$SRC"

echo "2/5 backing up $DST -> $BAK"
cp -p "$DST" "$BAK"

echo "3/5 installing"
install -m 644 -o root -g root "$SRC" "$DST"

echo "4/5 validating what is now installed"
nginx -t

echo "5/5 reloading"
systemctl reload nginx

echo
echo "OK. Installed $(wc -c < "$DST") bytes. Backup: $BAK"
echo "Roll back with: sudo cp $BAK $DST && sudo nginx -t && sudo systemctl reload nginx"
