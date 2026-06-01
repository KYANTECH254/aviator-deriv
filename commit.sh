#!/usr/bin/env bash
set -e

# Prompt for a commit message
echo "Enter commit message: "
read -r commit_message

# Function to handle nested repository commits
commit_in_dir() {
  local dir=$1
  if [ -d "$dir/.git" ]; then
    echo "Processing $dir..."
    (cd "$dir" && git add . && git commit -m "$commit_message" --quiet || echo "No changes in $dir")
  fi
}

# If message is empty, use a default one with the current timestamp
if [ -z "$commit_message" ]; then
  commit_message="chore: update $(date +'%Y-%m-%d %H:%M:%S')"
fi

# Commit changes in sub-projects first
commit_in_dir "client"
commit_in_dir "server"

# Stage all changes in root (including submodule updates)
git add .

# Commit changes
git commit -m "$commit_message" || echo "No changes to commit in root."

# Push to the current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
git push origin "$CURRENT_BRANCH"

echo "--------------------------------------------------"
echo "Changes committed and pushed to branch: $CURRENT_BRANCH"