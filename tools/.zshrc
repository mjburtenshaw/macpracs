# ZSH Configuration

## [bun](https://bun.sh)

[ -s "/Users/mjburtenshaw/.bun/_bun" ] && source "/Users/mjburtenshaw/.bun/_bun"
export BUN_INSTALL="${HOME}/.bun"
export PATH="${BUN_INSTALL}/bin:${PATH}"

## [`eng-dev`](https://github.com/mjburtenshaw/eng-dev)

export version_increment_type=patch
alias inc-ver="${HOME}/Code/eng-dev/scripts/increment-version/index.sh"

## [`halo-devs`](https://gitlab.com/halo-devs)

export halo_devs_home="${HOME}/code/gitlab.com/halo-devs"
alias ssh-halo-api="ssh -i ${HOME}/.secrets/halo/halo-api.pem ubuntu@ec2-52-53-212-132.us-west-1.compute.amazonaws.com"
alias ssh-halo-marketing-site="ssh -i ${HOME}/.secrets/halo/halo-marketing-site.pem ubuntu@ec2-13-57-232-14.us-west-1.compute.amazonaws.com"

## [Google Cloud SDK](https://cloud.google.com/sdk/docs)

if [ -f "${HOME}/google-cloud-sdk/path.zsh.inc" ]; then . "${HOME}/google-cloud-sdk/path.zsh.inc"; fi
if [ -f "${HOME}/google-cloud-sdk/completion.zsh.inc" ]; then . "${HOME}/google-cloud-sdk/completion.zsh.inc"; fi

## [`macglab`](https://github.com/mjburtenshaw/macglab)

export MACGLAB="${HOME}/.macglab"
export PATH="${MACGLAB}/bin:${PATH}"
alias macglab="${MACGLAB}/bin"

## [`ohmyzsh`](https://github.com/ohmyzsh/ohmyzsh/wiki)

export ZSH="${HOME}/.oh-my-zsh"
ZSH_THEME=bullet-train
plugins=(colored-man-pages colorize git themes)
source "${ZSH}/oh-my-zsh.sh"

### [`bullet-train`](https://github.com/caiogondim/bullet-train.zsh)

current_time=$(date +%H%M)
current_date=$(date "+%Y-%m-%d")
sunrise=$(python3 -c "from datetime import datetime; from astral.sun import sun; from astral import LocationInfo; import pytz; city = LocationInfo('Salt Lake City', 'USA', 'America/Denver', 40.7608, -111.8910); s = sun(city.observer, date=datetime.strptime('$current_date', '%Y-%m-%d'))['sunrise']; local_sunrise = s.astimezone(pytz.timezone('America/Denver')); print(local_sunrise.strftime('%H%M'))")
sunset=$(python3 -c "from datetime import datetime; from astral.sun import sun; from astral import LocationInfo; import pytz; city = LocationInfo('Salt Lake City', 'USA', 'America/Denver', 40.7608, -111.8910); s = sun(city.observer, date=datetime.strptime('$current_date', '%Y-%m-%d'))['sunset']; local_sunset = s.astimezone(pytz.timezone('America/Denver')); print(local_sunset.strftime('%H%M'))")
if [[ "${sunrise}" -lt "${current_time}" && "${current_time}" -lt "${sunset}" ]]; then
  # It's day. Use a dark prompt against a light background.
  BULLETTRAIN_DIR_BG=black
  BULLETTRAIN_DIR_FG=white
  BULLETTRAIN_GIT_AHEAD="%F{white} ⬆%F${black}%f"
  BULLETTRAIN_GIT_BEHIND="%F{white} ⬇%F${black}%f"
  BULLETTRAIN_GIT_BG=black
  BULLETTRAIN_GIT_DIVERGED="%F{white} ⬍%F${black}%f"
  BULLETTRAIN_GIT_FG=white
  BULLETTRAIN_GIT_RENAMED="%F{white}➜%F${black}%f"
  BULLETTRAIN_GIT_UNMERGED="%F{white}═%F${black}%f"
  BULLETTRAIN_TIME_BG=black
  BULLETTRAIN_TIME_FG=white
else
  # It's night. Use a light prompt against a dark background.
  BULLETTRAIN_DIR_BG=white
  BULLETTRAIN_DIR_FG=black
  BULLETTRAIN_GIT_BG=white
  BULLETTRAIN_GIT_FG=black
  BULLETTRAIN_TIME_BG=white
  BULLETTRAIN_TIME_FG=black
fi
BULLETTRAIN_DIR_EXTENDED=0
BULLETTRAIN_PROMPT_CHAR="%F{red}❱%F{yellow}❱%F{green}❱%f"
BULLETTRAIN_PROMPT_ORDER=(time dir git)
BULLETTRAIN_PROMPT_SEPARATE_LINE=false

## solo

export SOLO_HOME="${HOME}/code/gitlab.com/gosolo/solo"
source "${SOLO_HOME}"/scripts/local/.bashrc_aliases

### nvm shell completion

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

