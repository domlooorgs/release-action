#!/bin/bash
set -euo pipefail

if [ "$GITHUB_EVENT_NAME" == "issue_comment" ]; then
  echo "COMMENT_FOUND=$RAW_COMMENT" >> $GITHUB_ENV
  echo "IS_COMMENT=true" >> $GITHUB_ENV
fi