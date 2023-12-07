#!/bin/bash

add_ssh_key() {
  echo "Enter your device name, e.g. mba (for macbook air): "
  read device_name

  keyfile=mjb-$device_name-personal-github-auth-key
  keyfile_path=~/.ssh/$keyfile

  echo "Use the following keyfile path to fill in prompts:"
  echo -e "\n$keyfile_path\n"
  echo $keyfile_path | pbcopy
  echo "COPIED TO CLIPBOARD! :D"

  ssh-keygen -t ed25519 -C "$keyfile"

  eval "$(ssh-agent -s)"

  touch ~/.ssh/config 

  cat << EOF >> ~/.ssh/config
Host github.com
  AddKeysToAgent yes
  IdentityFile $keyfile_path

EOF
  ssh-add $keyfile_path

  echo "Copy the public key and register it with GitHub"
  pbcopy < $keyfile_path.pub
  echo "COPIED TO CLIPBOARD! :D"
}

clone_repo() {
  export mjbhome=~/code/github.com/mjburtenshaw
  mkdir -p $mjbhome
  operating_dir=$(pwd)
  cd $mjbhome
  git clone git@github.com:mjburtenshaw/macpracs.git
  cd $operating_dir
}

install_zsh_dependencies() {
  echo "Installing python packages..."
  sudo -H pip3 install astral
  sudo -H pip3 install pytz

  echo "Installing oh-my-zsh..."
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
  cp ~/code/github.com/mjburtenshaw/macpracs/tools/resources/bullet-train.zsh-theme.txt $ZSH_CUSTOM/themes/bullet-train.zsh-theme

  echo "Installing nvm..."
  PROFILE=/dev/null bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash'

  echo "Resourcing shell session..."
  cp ~/.zshrc ~/.zshrc.macpracs-backup
  cp $mjbhome/macpracs/tools/.zshrc ~/.zshrc
  source .zshrc
}

install_color_palettes() {
  color_palettes_dir=$mjbhome/macpracs/tools/resources/color_palettes

  setopt NULL_GLOB
  color_palettes=($color_palettes_dir/*.config.zsh)
  unsetopt NULL_GLOB

  if [[ ${#color_palettes[@]} -eq 0 ]]; then
    echo "Warning: No color_palettes found in $color_palettes_dir."
    return
  fi

  for color_palette in "${color_palettes[@]}"; do
    open "$color_palette"
  done
}

install_terminal_profiles() {
  terminal_profiles_dir=$mjbhome/macpracs/tools/resources/terminal_profiles

  setopt NULL_GLOB
  terminal_profiles=($terminal_profiles_dir/*.config.zsh)
  unsetopt NULL_GLOB

  if [[ ${#terminal_profiles[@]} -eq 0 ]]; then
    echo "Warning: No terminal profile files found in $terminal_profiles_dir."
    return
  fi

  for terminal_profile in "${terminal_profiles[@]}"; do
    open "$terminal_profile"
  done
}

echo "This script uses sudo to install the following python packages in the global scope:"
echo "    - astral"
echo "    - pytz"
echo "Is that okay? (y/n) "
read should_run

if [[ "$should_run" != "y" ]]; then
  echo "Okay. We'll leave it alone."
  return
fi

add_ssh_key
clone_repo
install_zsh_dependencies
install_color_palettes
install_terminal_profiles

echo "Done!"
