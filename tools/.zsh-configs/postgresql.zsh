# [PostgreSQL](https://www.postgresql.org/download/macosx/)

# Installed via homebrew
# Caveats
# This formula has created a default database cluster with:
#   initdb --locale=C -E UTF-8 /opt/homebrew/var/postgresql@16
# For more details, read:
#   https://www.postgresql.org/docs/16/app-initdb.html

# postgresql@16 is keg-only, which means it was not symlinked into /opt/homebrew,
# because this is an alternate version of another formula.

# If you need to have postgresql@16 first in your PATH, run:
#   echo 'export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"' >> ~/.zshrc

# For compilers to find postgresql@16 you may need to set:
#   export LDFLAGS="-L/opt/homebrew/opt/postgresql@16/lib"
#   export CPPFLAGS="-I/opt/homebrew/opt/postgresql@16/include"

# To start postgresql@16 now and restart at login:
#   brew services start postgresql@16
# Or, if you don't want/need a background service you can just run:
#   LC_ALL="C" /opt/homebrew/opt/postgresql@16/bin/postgres -D /opt/homebrew/var/postgresql@16

export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
