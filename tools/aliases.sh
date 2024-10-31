#!/bin/sh

# python3 can use a Homebrew installation as the default. Some
# configuration files in this project rely on Python packages not available
# in the Homebrew ecosystem. This alias allows direct invocations of
# python3 to use the full ecosystem without breaking Homebrew packages
# which use the Homebrew installation of python3 as a dependency.
alias python3="/usr/local/bin/python3"
