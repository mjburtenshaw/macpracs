# [`ohmyzsh`](https://github.com/ohmyzsh/ohmyzsh/wiki)

export ZSH="${HOME}/.oh-my-zsh"
ZSH_THEME=bullet-train
plugins=(colored-man-pages colorize git themes)
# Auto-update oh-my-zsh without prompting
zstyle ':omz:update' mode auto
source "${ZSH}/oh-my-zsh.sh"
