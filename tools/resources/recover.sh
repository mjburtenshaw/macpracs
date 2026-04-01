#!/bin/zsh
# shellcheck disable=SC2162  # zsh read "var?prompt" syntax assigns variables
# shellcheck disable=SC2154  # variables assigned via zsh read "var?prompt" syntax
# shellcheck disable=SC1090,SC1091  # can't follow dynamic source paths

export mjbhome=~/github.com/mjburtenshaw

add_ssh_key() {
    echo "🔑 Adding SSH key..."
    read -p "device_name?💻 Enter your device name, e.g. mba (for MacBook Air): "

    keyfile=mjb-$device_name-personal-github-auth-key
    keyfile_path=~/.ssh/$keyfile

    echo -e "\n$keyfile_path\n"
    echo "☝🏻  Use the copied keyfile path to fill in prompts:"
    echo "$keyfile_path" | pbcopy
    echo "📋 Copied to clipboard"

    ssh-keygen -t ed25519 -C "$keyfile"

    eval "$(ssh-agent -s)"

    touch ~/.ssh/config 

    cat << EOF >> ~/.ssh/config
Host github.com
    AddKeysToAgent yes
    IdentityFile $keyfile_path

EOF
    ssh-add "$keyfile_path"

    pbcopy < "${keyfile_path}.pub"
    echo "📋 COPIED TO CLIPBOARD! :D"

    echo -e "\n$keyfile_path.pub\n"

    read "?☝🏻 Copy the public key and register it with GitHub. Return here and press any key to continue."
}

clone_repo() {
    echo "📡 Cloning macpracs..."
    mkdir -p "$mjbhome"
    operating_dir=$(pwd)
    cd "$mjbhome" || return
    git clone git@github.com:mjburtenshaw/macpracs.git
    cd "$operating_dir" || return
}

install_builtins() {
    echo "💾 Installing builtins..."

    install_homebrew

    echo "Installing GitHub CLI..."
    brew install gh

    echo -e "\nhttps://www.logitech.com/en-us/software/logi-options-plus.html\n"
    read "?☝🏻 Download and install LogiOptions+. Return here and press any key to continue."

    echo -e "\nhttps://rectangleapp.com\n"
    read "?☝🏻 Download and install Rectangle Pro. Return here and press any key to continue."

    unzip $mjbhome/macpracs/tools/resources/Fira_Code.zip -d ~/Downloads/Fira_Code
    read "?☝🏻 Go to your Downloads folder and add the Fira Code TTF files to your Font Book. Return here and press any key to continue."

    echo -e "\nhttps://go.dev/doc/install\n"
    read "?☝🏻 Download and install Go. Return here and press any key to continue."

    echo -e "\nhttps://www.python.org/downloads/\n"
    read "?☝🏻 Download and install Python. Return here and press any key to continue."
    
    install_terraform

    echo -e "\nhttps://obsidian.md\n"
    read "?☝🏻 Download and install Obsidian. Return here and press any key to continue."

    echo -e "\nhttps://www.docker.com\n"
    read "?☝🏻 Download and install Docker Desktop. Return here and press any key to continue."

    echo -e "\nhttps://tableplus.com/download\n"
    read "?☝🏻 Download and install TablePlus. Return here and press any key to continue."

    echo "Installing KeyCastr..."
    brew install --cask keycastr

    echo -e "\nhttps://code.visualstudio.com\n"
    read "?☝🏻 Download and install VS Code, and enable command line tools. Return here and press any key to continue."

    read "?👉🏻 Open the app store to download and install Xcode, and accept the license agreement. Return here and press any key to continue."
}

install_color_palettes() {
    echo "🎨 Installing color palettes..."

    color_palettes_dir=$mjbhome/macpracs/tools/resources/color-palettes

    setopt NULL_GLOB
    # shellcheck disable=SC2206  # intentional zsh glob array with NULL_GLOB
    color_palettes=($color_palettes_dir/*.clr)
    unsetopt NULL_GLOB

    if [[ ${#color_palettes[@]} -eq 0 ]]; then
        echo "💣 Warning: No color_palettes found in $color_palettes_dir."
        return
    fi

    for color_palette in "${color_palettes[@]}"; do
        open "$color_palette"
    done
}

install_homebrew() {
    echo "🍺 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    read "first_time? 🆕 First time installing Homebrew on this machine? (y/n): "

    if [[ "$first_time" == "y" ]]; then
        # add brew to PATH
        echo >> /Users/malcolmburtenshaw/.zprofile
        # shellcheck disable=SC2016  # intentional: single quotes prevent expansion at write time
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> /Users/malcolmburtenshaw/.zprofile
    fi

    eval "$(/opt/homebrew/bin/brew shellenv)"
}

install_node() {
    echo "💾 Installing Node..."
    PROFILE=/dev/null bash -c 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash'
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    nvm install 20
}

install_terminal_profiles() {
    echo "🎨 Installing terminal profiles..."

    terminal_profiles_dir=$mjbhome/macpracs/tools/resources/terminal-profiles

    setopt NULL_GLOB
    # shellcheck disable=SC2206  # intentional zsh glob array with NULL_GLOB
    terminal_profiles=($terminal_profiles_dir/*.terminal)
    unsetopt NULL_GLOB

    if [[ ${#terminal_profiles[@]} -eq 0 ]]; then
        echo "💣 Warning: No terminal profile files found in $terminal_profiles_dir."
        return
    fi

    for terminal_profile in "${terminal_profiles[@]}"; do
        open "$terminal_profile"
    done

    # enable auto switching profiles based on OS appearance
    auto-terminal-profile enable --dark-profile='solarized-dark' --light-profile='solarized-light'
}

install_terraform() {
    echo "💾 Installing Terraform..."
    brew tap hashicorp/tap
    brew install hashicorp/tap/terraform
    brew update
    brew upgrade hashicorp/tap/terraform
}

install_zsh_dependencies() {
    echo "💾 Installing python packages..."
    pip_install astral
    pip_install pytz

    echo "💾 Installing oh-my-zsh..."
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
    ZSH_CUSTOM=~/.oh-my-zsh/custom
    cp ~/github.com/mjburtenshaw/macpracs/tools/resources/bullet-train.zsh-theme.txt $ZSH_CUSTOM/themes/bullet-train.zsh-theme

    install_node

    resource_shell_session

    echo "💾 Installing auto-terminal-profile..."
    npm install --global auto-terminal-profile
}

# python3 can use a Homebrew installation as the default. Some
# configuration files in this project rely on Python packages not available
# in the Homebrew ecosystem. This alias allows direct invocations of
# python3 to use the full ecosystem without breaking Homebrew packages
# which use the Homebrew installation of python3 as a dependency.
#
# See also: aliases.sh
pip_install() {
    /usr/local/bin/python3 -m pip install --user "$1"
}

# Function to prompt user before running each task
prompt_user() {
    local message=$1
    local function_to_call=$2
    read "should_run?$message (y/n): "
    if [[ "$should_run" == "y" ]]; then
        $function_to_call
    fi
}

resource_shell_session() {
    echo "🔃 Resourcing shell session..."

    cp ~/.zshrc ~/.zshrc.macpracs-backup

    cp $mjbhome/macpracs/tools/.zshrc ~/.zshrc

    read "is_using_halo?😇 Are you using Halo on this machine? (y/n): "

    if [[ "$is_using_halo" != "y" ]]; then
        sed -i '' '2a\
export skip_halo=true\
' ~/.zshrc
    fi

    read "create_hushlogin?🤫 Create ~/.hushlogin to suppress login messages? (y/n): "

    if [[ "$create_hushlogin" == "y" ]]; then
        touch ~/.hushlogin
    fi

    read "is_using_mango?🥭 Are you using Mango on this machine? (y/n): "

    if [[ "$is_using_mango" != "y" ]]; then
        sed -i '' '2a\
export skip_mango=true\
' ~/.zshrc
    fi

    source ~/.zshrc
}

sign_waiver() {
    echo "This script uses sudo to install the following python packages in the global scope:"
    echo "    - astral"
    echo "    - pytz"
    read "should_run?🛂 Is that okay? (y/n): "
    if [[ "$should_run" != "y" ]]; then
        exit 0
    fi
}

update_builtins() {
    /Applications/Xcode.app/Contents/Developer/usr/bin/python3 -m pip install --upgrade pip
}

sign_waiver
install_builtins
update_builtins
prompt_user "🔑 Add SSH key?" add_ssh_key
prompt_user "📡 Clone repository?" clone_repo
prompt_user "🐢 Install ZSH dependencies?" install_zsh_dependencies
prompt_user "🎨 Install color palettes?" install_color_palettes
prompt_user "🎨 Install terminal profiles?" install_terminal_profiles

echo "🎉 Done!"
