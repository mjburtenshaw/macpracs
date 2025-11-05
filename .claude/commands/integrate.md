---
description: "Integrate code changes with automated review, versioning, commit, tag, and push"
---

# Code Integration Workflow

Execute this complete workflow to integrate and release changes to the main branch.

## Step 1: Validation

Run all validation checks to ensure code quality before integration.

### Shell Script Validation

Find and validate all shell scripts:

```bash
# Find all .sh files in tools/ directory
find tools -type f -name "*.sh"
```

For each `.sh` file found:

1. **Syntax Check**: Run `bash -n <file>` to verify syntax
2. **ShellCheck**: Run `shellcheck -s bash <file>` to check for issues

**If any validation fails:**
- Report the specific file and error
- STOP the integration workflow
- User must fix issues and run `/integrate` again

**If all shell scripts pass:**
- Report success: "✓ All shell scripts passed validation"
- Continue to CLI validation

### CLI Validation (Conditional)

**Check if CLI files changed:**

```bash
git diff --name-only HEAD | grep "^cli/"
git diff --staged --name-only | grep "^cli/"
```

**If CLI files changed:**

1. **TypeScript Check**: Run from repo root:
   ```bash
   npm run typecheck
   ```

2. **ESLint**: Run from repo root:
   ```bash
   npm run lint
   ```

**If any CLI validation fails:**
- Report the specific error
- STOP the integration workflow
- User must fix issues and run `/integrate` again

**If no CLI files changed:**
- Skip CLI validation
- Report: "ℹ️ No CLI changes detected, skipping TypeScript/ESLint checks"

**If all validations pass:**
- Report summary: "✅ All validation checks passed"
- Continue to Step 2

## Step 2: Review Changes

Gather information about all changes:

```bash
git status
git diff
git diff --staged
```

Analyze and present a summary organized by:
- **Modified files**: What changed and why
- **New files**: What was added and its purpose
- **Deleted files**: What was removed (if any)
- **Staged vs unstaged**: Clear separation

Present the summary in a clear, organized format.

## Step 3: Approval Gate

Ask the user: "Do these changes look ready to integrate?"

**If NO:**
- Ask: "What would you like to change?"
- Make the requested modifications
- STOP and wait for user to run `/integrate` again

**If YES:**
- Proceed to Step 4

## Step 4: Determine Version Bumps

Analyze the changes to determine version bumps:

### For CLI Package (`cli/package.json`)

**Check if CLI-related files changed:**
- Any files in `cli/` directory?
- Any changes to CLI functionality?

**If YES:**
1. Read current version from `cli/package.json`
2. Analyze commit types in the changes:
   - **MAJOR bump**: Breaking changes (refactor!, feat!, fix! with '!')
   - **MINOR bump**: New features (feat:)
   - **PATCH bump**: Bug fixes, docs, chores (fix:, docs:, chore:, style:)
3. Calculate new version: `{MAJOR}.{MINOR}.{PATCH}`
4. Present recommendation to user

**If NO:** Version stays the same

### For README Badge (`README.md`)

**Check if documentation version should bump:**
- Any user-facing changes?
- Any policy/procedure updates?
- Any significant documentation additions?

**If YES:**
1. Look for version badge or version reference in `README.md`
2. Read current version
3. Apply same logic as above (MAJOR/MINOR/PATCH based on change type)
4. Calculate new version
5. Present recommendation to user

**Note:** CLI and README versions are tracked separately and may have different version numbers.

**Ask user to confirm version bumps or override with different bump type.**

## Step 5: Create Commit

### Update Versions (if bumped)

If CLI version bumped:
- Update `"version"` field in `cli/package.json`

If README version bumped:
- Update version badge in `README.md`
- Update any other version references

### Stage Changes

Stage all relevant files:
```bash
git add -A
```

### Craft Commit Message

Analyze the changes and automatically generate a commit subject line following conventional commit format:
- Format: `<type>: <description>`
- Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `test`
- Use exclamation mark after type for breaking changes (example: feat!: or fix!:)
- Description should explain WHY, not just WHAT
- Be specific and concise about the purpose of the changes

**Example:** `feat: Add granular timestamp scaling for pipeline status display`

Create the full commit message with standard footer:

```
<generated subject line>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

Execute the commit:
```bash
git commit -m "<full commit message>"
```

## Step 6: Create Tag

**If the README version was bumped:**

Always use the README version for the main project tag (README version is the source of truth for project versioning).

Create annotated tag with `v` prefix:
```bash
git tag -a v{MAJOR}.{MINOR}.{PATCH} -m "<commit subject line>"
```

**Example:** `git tag -a v3.2.0 -m "feat: Add granular timestamp scaling for pipeline status display"`

**Note:** CLI version bumps are tracked separately in `cli/package.json` but do not create project-level tags.

## Step 7: Push to Remote

Push both commit and tags:
```bash
git push origin main --follow-tags
```

Verify successful push and report status to user.

## Arguments

Use `{{{ARGS}}}` for optional flags:
- `--dry-run`: Show what would be done without executing
- `--skip-approval`: Skip approval gate (use with caution)

---

## Summary

After completion, provide a summary:
- Version bumps applied (if any)
- Commit SHA
- Tag created (if any)
- Push status
- Next steps (if any)
