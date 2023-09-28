# [`bullet-train`](https://github.com/caiogondim/bullet-train.zsh)

BULLETTRAIN_DIR_EXTENDED=0
BULLETTRAIN_PROMPT_CHAR="%F{red}❱%F{yellow}❱%F{green}❱%f"
BULLETTRAIN_PROMPT_ORDER=(time dir git)
BULLETTRAIN_PROMPT_SEPARATE_LINE=false

set_bullet_train_theme() {
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
}

set_bullet_train_theme
