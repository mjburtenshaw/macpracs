# [gosolo](https://gitlab.com/gosolo)

export solohome="${HOME}/code/gitlab.com/gosolo"

export SOLO_HOME="${HOME}/code/gitlab.com/gosolo/solo"
[ -s "${SOLO_HOME}/scripts/local/.bashrc_aliases" ] && source "${SOLO_HOME}/scripts/local/.bashrc_aliases"

# nvm shell completion
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && source "$NVM_DIR/bash_completion"
