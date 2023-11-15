[🔝 TOP: README](README.md)

[🔙 BACK: Developer Analysis](developer-analysis.md)

Development
====================

> *"I thought clay must feel happy in the good potter's hand."*
> 
> *- Janet Fitch*

A methodical approach to developing good software.

Table of Contents
---------------------------

- [Preparation](#preparation)
- [Execution](#execution)
- [Merge](#merge)
- [See Also](#see-also)

Preparation
-----------------

1. Select an appropriate donor branch.

> 🪴 *Consider the project's branching model when choosing the donor branch.*

2. Ensure you have the latest from the donor's remote branch.
3. Checkout to a new branch off of the donor.

> 🏭 *My branch name convention is my initials suffixed with a slash followed by either a task ID, if available, or a semantic descriptor, e.g., `mjb/12a3bc45` or `mjb/add-widget`*

4. Start a local server.
5. Verify the server is in operating condition.

> 🧼 *Note preexisting runtime anomalies. It's important to know if you introduce anything **new**. A clean console makes for a happy developer because new changes are easier to spot.*

6. Locate tests for the development area.
7. Verify the tests are green.
8. Make style changes to the development area.
9. Verify the tests are green.
10. Commit style changes.
11. Make small refactors to the development area.
12. Verify the tests are green.
13. Commit small refactors.

> 🏚️ *Don't live with [broken windows](https://en.wikipedia.org/wiki/Broken_windows_theory)*

> 🏗️ *If large refactors are needed, work on those first in a separate branch.*

Execution
--------------

1. Add a red test for the changes you want to introduce.
2. Apply changes that satisfy the test. Collaborate as needed.
3. [Document](https://github.com/mjburtenshaw/the-pragmatic-scribe) changes.
4. Commit the changes.
5. Repeat until you achieve the solution outcome.

Merge
--------

1. Review the changes you made on your branch with the donor branch.
2. Perform cleanup as needed.
3. Push changes to the remote.
4. Request a peer review by the means designated for the project.

> 🪴 *Remember to target the donor branch!*

5. [Debrief](README.md#debrief) the context.

See Also
------------

- 🏚️ [Broken windows theory](https://en.wikipedia.org/wiki/Broken_windows_theory)
- 🦅 [The Boy Scout Rule](https://twitter.com/unclebobmartin/status/1591443936836747264?lang=en#)

[⏭️ NEXT: Debrief](README.md#debrief)
