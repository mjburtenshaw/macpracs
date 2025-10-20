#!/usr/bin/env bash
#
# github-pr-activity.sh - Fetch and format GitHub PR activity for LLM consumption
#
# Usage:
#   ./github-pr-activity.sh <pr-number> [repo]
#
# Examples:
#   ./github-pr-activity.sh 123
#   ./github-pr-activity.sh 456 owner/repo
#
# Output:
#   Markdown-formatted PR description and comments, optimized for LLM parsing

set -euo pipefail

usage() {
    cat << EOF
Usage: $(basename "$0") <pr-number> [repo]

Arguments:
    pr-number           Pull request number
    repo                Repository in owner/repo format (optional, defaults to current repo)

Examples:
    $(basename "$0") 123
    $(basename "$0") 456 owner/repo

Output:
    Markdown-formatted PR activity to stdout (pipe to pbcopy for clipboard)

Requirements:
    - gh CLI must be installed and authenticated
EOF
    exit 1
}

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "Error: gh CLI is not installed"
    echo "Install with: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

if [[ $# -lt 1 ]]; then
    usage
fi

PR_NUMBER="$1"
REPO_ARG=""

if [[ $# -ge 2 ]]; then
    REPO_ARG="--repo $2"
fi

# Fetch PR data as JSON
PR_DATA=$(gh pr view "$PR_NUMBER" $REPO_ARG --json number,title,body,author,state,createdAt,updatedAt,comments 2>&1) || {
    echo "Error: Failed to fetch PR #$PR_NUMBER"
    echo "$PR_DATA"
    exit 1
}

# Extract fields using jq
PR_TITLE=$(echo "$PR_DATA" | jq -r '.title')
PR_AUTHOR=$(echo "$PR_DATA" | jq -r '.author.login')
PR_STATE=$(echo "$PR_DATA" | jq -r '.state')
PR_CREATED=$(echo "$PR_DATA" | jq -r '.createdAt')
PR_UPDATED=$(echo "$PR_DATA" | jq -r '.updatedAt')
PR_BODY=$(echo "$PR_DATA" | jq -r '.body // "No description provided"')

# Format and output PR information
cat << EOF
# PR #${PR_NUMBER}: ${PR_TITLE}

**Author:** @${PR_AUTHOR}
**Status:** ${PR_STATE}
**Created:** ${PR_CREATED}
**Updated:** ${PR_UPDATED}

---

## Description

${PR_BODY}

---

## Comments

EOF

# Extract and format comments
COMMENT_COUNT=$(echo "$PR_DATA" | jq '.comments | length')

if [[ "$COMMENT_COUNT" -eq 0 ]]; then
    echo "*No comments yet*"
else
    echo "$PR_DATA" | jq -r '.comments[] |
        "### Comment by @\(.author.login) - \(.createdAt)\n\n\(.body)\n"'
fi

cat << EOF

---

*Generated with macpracs CLI*
EOF
