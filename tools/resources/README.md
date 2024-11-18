Resources
=========

> *"The most valuable resource we have in software development is time."*
>
> *-Unknown*

Table of Contents
------------------

- [Items](#items)
- [Recovery](#recovery)

Items
------

- Color palettes; because having pretty colors is nice, but very tedious to make from scratch.
- Terminal profiles; terminal profiles are also a pain to set up.
- Recovery resources:
    - Bullet Train source code.
- Fonts:
    - Fira Code.
- Scripts:
    - [`recover.sh`](/tools/resources/recover.sh): See [Recovery](#recovery).
    - [`add-ssh-key.sh`](/tools/resources/add-ssh-key.sh). This was a useful artifact of the first iteration of the recover script.

Recovery
---------

Not everything works out of the box!

This is what I would do if I had to get up an running on a new machine as quickly as possible:
1. Run [`recover.sh`](/tools/resources/recover.sh).
2. Install programs listed in [Software and Services](/tools/README.md#software-and-services).
