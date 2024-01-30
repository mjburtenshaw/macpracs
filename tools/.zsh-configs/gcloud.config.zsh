# [Google Cloud SDK](https://cloud.google.com/sdk/docs)

export GOOGLE_APPLICATION_CREDENTIALS="${HOME}/.config/gcloud/application_default_credentials.json"

if [ -f "${HOME}/google-cloud-sdk/path.zsh.inc" ]; then source "${HOME}/google-cloud-sdk/path.zsh.inc"; fi
if [ -f "${HOME}/google-cloud-sdk/completion.zsh.inc" ]; then source "${HOME}/google-cloud-sdk/completion.zsh.inc"; fi
