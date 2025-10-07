#!/bin/bash

# Release script for Researchers App
# Usage: ./scripts/release.sh [version]

set -e

# Check if version is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <version>"
    echo "Example: $0 v1.0.0"
    exit 1
fi

VERSION=$1

# Remove 'v' prefix if present for package.json
PACKAGE_VERSION=${VERSION#v}

echo "🚀 Preparing release $VERSION..."

# Check if we're on main branch
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "❌ You must be on the main branch to create a release"
    exit 1
fi

# Check if working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit all changes first."
    exit 1
fi

# Update package.json version
echo "📝 Updating package.json version to $PACKAGE_VERSION..."
npm version $PACKAGE_VERSION --no-git-tag-push

# Commit version bump
echo "💾 Committing version changes..."
git add package.json package-lock.json
git commit -m "chore: bump version to $PACKAGE_VERSION"

# Create and push tag
echo "🏷️ Creating tag $VERSION..."
git tag $VERSION
git push origin main
git push origin $VERSION

echo "✅ Release $VERSION created successfully!"
echo "🚀 GitHub Actions will now build and publish the release."
echo "📦 You can monitor the progress in the Actions tab on GitHub."
