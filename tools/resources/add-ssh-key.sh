#!/bin/bash

echo "Do you want to use a passkey to protect your keyfile? (y/N)"
read should_use_passkey

echo "Enter the desired crypto algorithm, e.g. ed25519: "
read algo

echo "Enter your initials: "
read initials

echo "Enter your device name, e.g. mba (for macbook air): "
read device_name

echo "Enter the scope of the key, e.g. personal, work, etc.: "
read scope

echo "Enter the platform for the key, e.g., github, gitlab, etc.: "
read platform

echo "Enter the host domain for the key, e.g., github.com, gitlab.com, etc.: "
read host_domain

echo "Enter the usecase for the key, e.g. auth, signing, etc.: "
read usecase

keyfile=$initials-$device_name-$scope-$platform-$usecase-key
keyfile_path=~/.ssh/$keyfile

echo "Use the following keyfile path to fill in prompts:"
echo -e "\n$keyfile_path\n"
echo $keyfile_path | pbcopy
echo "COPIED TO CLIPBOARD! :D"

ssh-keygen -t $algo -C "$keyfile"

eval "$(ssh-agent -s)"

touch ~/.ssh/config 

if [[ "$should_use_passkey" == "y" ]]; then
  cat << EOF >> ~/.ssh/config
Host $host_domain
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile $keyfile_path

EOF
  ssh-add --apple-use-keychain $keyfile_path
else
  cat << EOF >> ~/.ssh/config
Host $host_domain
  AddKeysToAgent yes
  IdentityFile $keyfile_path

EOF
  ssh-add $keyfile_path
fi

echo "Copy the public key and register it with $platform"
pbcopy < $keyfile_path.pub
echo "COPIED TO CLIPBOARD! :D"
