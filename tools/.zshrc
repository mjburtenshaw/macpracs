# ZSH Configuration

export mjbhome="${HOME}/code/github.com/mjburtenshaw"

source $mjbhome/macpracs/tools/aliases.sh

zsh_configs_dir="${mjbhome}/macpracs/tools/.zsh-configs"

# Check if directory exists
if [[ ! -d "$zsh_configs_dir" ]]; then
  echo "Error: Configuration directory $zsh_configs_dir does not exist."
  return 1
fi

# If no files match, continue without error
setopt NULL_GLOB
zsh_configs=($zsh_configs_dir/*.config.zsh)
unsetopt NULL_GLOB

if [[ ${#zsh_configs[@]} -eq 0 ]]; then
  echo "Warning: No .config.zsh files found in $zsh_configs_dir."
  return 1
fi

# Source the .config.zsh files
for file in "${zsh_configs[@]}"; do
  source "$file"
done
