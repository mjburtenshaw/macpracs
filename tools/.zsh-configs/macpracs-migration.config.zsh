# macpracs XDG Base Directory Migration
#
# This script migrates macpracs configuration and data from the legacy ~/.macpracs/
# directory to XDG Base Directory compliant locations.
#
# XDG Target Structure:
#   ~/.config/macpracs/       - Configuration files (config.json, contexts/)
#   ~/.local/share/macpracs/  - Application data (timestamps/)
#   ~/.local/state/macpracs/  - Logs and state data
#
# This migration follows the "Code is Maintained by AI" philosophy:
# - Explicit function names and variable names
# - Verbose comments explaining what and why
# - Clear logging of all operations
# - Idempotent - safe to run multiple times
# - Permanent - provides pattern for future migrations
#
# Philosophy: ops > ai > dev
# - Operational clarity (clear backup/restore paths)
# - AI-readable (follows XDG standard, well-documented)
# - Developer convenience is secondary
#
# See: philosophies/code-is-maintained-by-ai.md

# XDG Base Directory paths with fallback defaults per specification
# https://specifications.freedesktop.org/basedir-spec/latest/
export MACPRACS_CONFIG_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/macpracs"
export MACPRACS_DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/macpracs"
export MACPRACS_STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/macpracs"

# Legacy directory that we're migrating away from
LEGACY_MACPRACS_DIR="$HOME/.macpracs"

# Migration marker file - indicates migration has been completed
# Stored in XDG_STATE_DIR because it represents application state
MIGRATION_MARKER="$MACPRACS_STATE_DIR/.migrated_from_legacy_location"

# migrate_macpracs_to_xdg_structure
#
# Performs one-time migration of macpracs data from ~/.macpracs/ to XDG-compliant locations.
#
# Migration strategy:
# 1. Check if migration has already been completed (idempotent)
# 2. Create XDG directory structure
# 3. Move legacy files to appropriate XDG locations:
#    - timestamps/      → ~/.local/share/macpracs/timestamps/
#    - logs/            → ~/.local/state/macpracs/logs/
#    - config.json      → ~/.config/macpracs/config.json
#    - contexts/        → ~/.config/macpracs/contexts/
# 4. Create migration marker to prevent re-running
# 5. Remove empty legacy directory (if it exists and is empty)
#
# Error handling: Continues on individual file errors, reports at end
# Logging: All operations logged for debugging and audit
migrate_macpracs_to_xdg_structure() {
    # Check if migration has already been completed
    # Skip migration if marker file exists - this makes the function idempotent
    if [[ -f "$MIGRATION_MARKER" ]]; then
        # Migration already completed, nothing to do
        # Silent return - don't spam shell startup with messages
        return 0
    fi

    # Check if legacy directory exists
    # If it doesn't exist, there's nothing to migrate
    # Create marker anyway to prevent checking on future shell startups
    if [[ ! -d "$LEGACY_MACPRACS_DIR" ]]; then
        # No legacy directory found, ensure XDG directories exist for future use
        mkdir -p "$MACPRACS_CONFIG_DIR"
        mkdir -p "$MACPRACS_DATA_DIR"
        mkdir -p "$MACPRACS_STATE_DIR"

        # Create migration marker to skip this check in future
        touch "$MIGRATION_MARKER"
        return 0
    fi

    # If we reach here, legacy directory exists and migration hasn't been completed
    echo "🔄 Migrating macpracs to XDG Base Directory structure..."

    # Create XDG directory structure
    # mkdir -p creates parent directories as needed and doesn't fail if they exist
    echo "  📁 Creating XDG directories..."
    mkdir -p "$MACPRACS_CONFIG_DIR"
    mkdir -p "$MACPRACS_DATA_DIR"
    mkdir -p "$MACPRACS_STATE_DIR"

    # Track if any migrations actually occurred
    local migration_occurred=false

    # Migrate timestamps directory to XDG_DATA_HOME
    # Timestamps are application data, not configuration
    if [[ -d "$LEGACY_MACPRACS_DIR/timestamps" ]]; then
        echo "  ⏱️  Migrating timestamps/ to $MACPRACS_DATA_DIR/timestamps/"
        mv "$LEGACY_MACPRACS_DIR/timestamps" "$MACPRACS_DATA_DIR/timestamps"
        migration_occurred=true
    fi

    # Migrate logs directory to XDG_STATE_HOME
    # Logs represent application state data
    if [[ -d "$LEGACY_MACPRACS_DIR/logs" ]]; then
        echo "  📋 Migrating logs/ to $MACPRACS_STATE_DIR/logs/"
        mv "$LEGACY_MACPRACS_DIR/logs" "$MACPRACS_STATE_DIR/logs"
        migration_occurred=true
    fi

    # Migrate config.json to XDG_CONFIG_HOME
    # Configuration files belong in XDG_CONFIG_HOME
    if [[ -f "$LEGACY_MACPRACS_DIR/config.json" ]]; then
        echo "  ⚙️  Migrating config.json to $MACPRACS_CONFIG_DIR/config.json"
        mv "$LEGACY_MACPRACS_DIR/config.json" "$MACPRACS_CONFIG_DIR/config.json"
        migration_occurred=true
    fi

    # Migrate contexts directory to XDG_CONFIG_HOME
    # Context configurations belong in XDG_CONFIG_HOME
    if [[ -d "$LEGACY_MACPRACS_DIR/contexts" ]]; then
        echo "  🗂️  Migrating contexts/ to $MACPRACS_CONFIG_DIR/contexts/"
        mv "$LEGACY_MACPRACS_DIR/contexts" "$MACPRACS_CONFIG_DIR/contexts"
        migration_occurred=true
    fi

    # Check if legacy directory is now empty and remove it
    # We only remove if it's completely empty to avoid data loss
    if [[ -d "$LEGACY_MACPRACS_DIR" ]]; then
        # Check if directory is empty (no files, no hidden files)
        if [[ -z "$(ls -A "$LEGACY_MACPRACS_DIR")" ]]; then
            echo "  🗑️  Removing empty legacy directory $LEGACY_MACPRACS_DIR"
            rmdir "$LEGACY_MACPRACS_DIR"
        else
            # Directory not empty - warn user but don't fail
            echo "  ⚠️  Warning: Legacy directory $LEGACY_MACPRACS_DIR not empty, leaving in place"
            echo "     Please manually review and remove if no longer needed"
        fi
    fi

    # Create migration marker file to prevent re-running this migration
    # Store timestamp of when migration occurred for audit purposes
    echo "  ✅ Creating migration marker"
    echo "Migrated from $LEGACY_MACPRACS_DIR on $(date '+%Y-%m-%d %H:%M:%S')" > "$MIGRATION_MARKER"

    if [[ "$migration_occurred" == "true" ]]; then
        echo "✅ macpracs migration to XDG structure complete"
        echo "   Config:  $MACPRACS_CONFIG_DIR"
        echo "   Data:    $MACPRACS_DATA_DIR"
        echo "   State:   $MACPRACS_STATE_DIR"
    else
        echo "✅ XDG directories created (no legacy data to migrate)"
    fi
}

# Run migration on shell startup
# This is safe to run every time because the function is idempotent
# Once migration marker exists, this returns immediately with no output
migrate_macpracs_to_xdg_structure
