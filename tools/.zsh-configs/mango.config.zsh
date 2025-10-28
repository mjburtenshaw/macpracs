# Mango configuration
if [[ $skip_mango != "true" ]]; then
    if [ -f "${HOME}/.config/mango/config.starfruit.sh" ]; then
        source "${HOME}/.config/mango/config.starfruit.sh"
    fi
fi
