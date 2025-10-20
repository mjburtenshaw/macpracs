# SSH Agent Configuration
# Automatically starts ssh-agent and loads all authentication keys

# Start ssh-agent if not already running
if ! pgrep -u "$USER" ssh-agent > /dev/null 2>&1; then
    eval "$(ssh-agent -s)" > /dev/null
fi

# Load all *-auth keys from ~/.ssh/ directory
# Only process files (not directories) that match the pattern
for key in ~/.ssh/*-auth; do
    # Check if file exists and is not a public key
    if [ -f "$key" ] && [[ "$key" != *.pub ]]; then
        ssh-add -q "$key" 2>/dev/null
    fi
done
