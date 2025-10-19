#!/bin/sh
set -euo pipefail

echo "Ensuring files and directories are recursively readable by anyone..."

TARGET_DIR="/var/www/html"

if [ -d "$TARGET_DIR" ]; then
  echo "Applying world-readable permissions under $TARGET_DIR"
  # Ensure directories are readable and traversable by anyone
  find "$TARGET_DIR" -type d -print0 | xargs -0 chmod a+rx || true
  # Ensure files are readable by anyone
  find "$TARGET_DIR" -type f -print0 | xargs -0 chmod a+r || true
else
  echo "Target directory $TARGET_DIR does not exist; skipping permission changes."
fi

exec "$@"