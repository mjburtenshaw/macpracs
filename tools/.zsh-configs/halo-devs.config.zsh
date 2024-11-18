# [`halo-devs`](https://gitlab.com/halo-devs)

if [[ $skip_halo != "true" ]]; then
    source ~/.config/halo/config.sh

    alias ssh-halo-api="ssh -i ${HOME}/.secrets/halo/halo-api.pem ubuntu@ec2-52-53-212-132.us-west-1.compute.amazonaws.com"
    alias ssh-halo-marketing-site="ssh -i ${HOME}/.secrets/halo/halo-marketing-site.pem ubuntu@ec2-13-57-232-14.us-west-1.compute.amazonaws.com"
fi
