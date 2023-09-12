[🔝 TOP: README](README.md)

[🔙 BACK: Tools](README.md#tools)

Peer Review
====================

How I perform peer reviews (PRs).

Table of Contents
---------------------------

- [Philosophy](#philosophy)
	- [Confidence](#confidence)
	- [For When I Have Breathing Room](#for-when-i-have-breathing-room)
	- [A Note About Templates](#a-note-about-templates)
- [Legend](#legend)
- [GitLab](#gitlab)
	- [Merge Request Health](#merge-request-health)
	- [Code Health](#code-health)
	- [Outcomes](#outcomes)

Philosophy
----------------

🏅 A good PR is all about ***confidence*** in proposed changes.

### Confidence

I gain confidence in PRs by checking three things:
1. Code health.
2. Solution outcomes.
3. Message detail.

It's worth noting I don't *dogmatically* run through a list of checkboxes to find that confidence. For example, if I see a thorough message and the code doesn't smell, that increases my **confidence** that the changes produce the desired outcomes. So, I won't pull changes down and validate outcomes myself if I don't feel it's warranted.

My confidence in PRs also extends from my professional trust in the author. For example, let's say an author has delivered desired outcomes consistently over a long period of time working with me. When they put up a hotfix with a poor message but healthy code, I'll still feel **confident** in approving the PR because of their track record.

Sometimes, I just gotta get the changes out with that confidence, and that's good enough. I don't always have time for the following, but when I do...

### For When I Have Breathing Room

PRs are among the few highly manual processes left in the realm of shipping code and provide regular touchpoints to check a system's health.

So, along with improving confidence in changes, a *great* PR provides a few opportunities:
1. Provides insightful opportunity into the well-being of the author.
2. Provides the same opportunity for the reviewer.
3. Assesses the impact of policies.
4. Assesses the effectiveness of procedures.
5. Assesses the utility of the review platform.

### A Note About Templates

I intend PR templates to have only some of their content used all the time. At first, using unabridged templates to set expectations for new teams and team members is helpful. But in time, you will see consistency on specific items and only need to focus on things your team struggles with.

> 👉 *Comments to the reviewer on templates are annotated.*

One day, it will become unnecessary for you to publish templates on PRs; they will transition to a companion to your peer review. In the fullness of times, an "LGTM" will be all you need to publish. On that note, here is a quote that captures the spirit of the templates:

### [End the debate once and for all. Do writing the objectives on the board do anything?](https://www.reddit.com/r/Teachers/comments/10vq3sn/end_the_debate_once_and_for_all_do_writing_the/j7iz4g1/?context=3)

> *You can't see inside your kids' minds to know if they are learning. So you design imperfect and sometimes even arbitrary and burdensome mechanisms to assess their learning and compliance. If all your kids were earnest and focused, many of these mechanisms would not be necessary.*
>
> *Admin cannot see inside your mind to make sure teachers are following their objectives. So they implement imperfect and sometimes even arbitrary and burdensome mechanisms to assess whether the teachers actually have plans. If all your teacher colleagues were earnest and followed through, many of these mechanism would not be necessary.*
>
> *For the first 90 seconds of class I have trained my 7th and 8th graders to assume total silence upon the bell and copy the objective into their planner. Does this help them learn? Not really. But it is a powerful management tool to calm and quiet the class, make sure they have a pencil in hand, and then quickly transition their attention to our first lesson activity.*
>
> *But why not do a warm up? Because kids were absent and don't know, can't do the warm up, etc. and then they cause problems. What can everyone do no matter what? Everyone can copy a sentence off the board.*

\- [u/Herodotus_Runs_Away](https://www.reddit.com/user/Herodotus_Runs_Away/) in response to [a question](https://www.reddit.com/r/Teachers/comments/10vq3sn/end_the_debate_once_and_for_all_do_writing_the/j7iz4g1/?context=3) from [u/TeacherGuy1980](https://www.reddit.com/user/TeacherGuy1980/) on [r/Teachers](https://www.reddit.com/r/Teachers/).

Legend
---------

[> 🗺️ *Legend definitions.*]: #
[> 🤖 *Because these indicators are machine-readable, I avoid using them to call out anomalies in the author's behavior.*]: #
[> 😀 *When I call out behavioral anomalies outside of the change request author's control, I use different emojis.*]: #

[> 🔴 *Major issues trigger a code review halt and status regression.*]: #
[> 🟡 *Minor issues trigger discussion.*]: #
[> 🟢 *Excellent work should be recognized and celebrated!*]: #
[> 🎙️ *Nitpicks are optional considerations.*]: #

I annotate my notes using the following legend:  
> 🔴 *Major issues*  
> 🟡 *Minor issues*  
> 🟢 *Excellent work*  
> 🎙️ *Nitpicking*

GitLab
----------

📝 I only review Draft Merge Requests when expressly asked.

🔗 If there's a linked task, I update its metadata.

### Merge Request Health

- [ ] **Target:** The merge request targets the desired branch.
- [ ] **Title:** The title is appropriate.
- [ ] **Description:** The description provides sufficient detail.
- [ ] **Validation:** Details when to observe desired vs. current outcomes.
- [ ] **Metadata:**
	- [ ] Assignee.
	- [ ] Reviewers.
	- [ ] Milestone.
	- [ ] Labels.
	- [ ] Merge options.
- [ ] **Pipelines:**

	[> 💡 *A good development strategy runs integration tests locally before creating a merge request.*]: #

	[> 🏫 *A high average of pipelines is a key indicator of issues in Task grooming, developer analysis, or scope creep.*]: #

	[> 💸 *GitLab charges for CI/CD in minutes, so keeping the number of pipelines to a minimum saves on costs.*]: #

	[> 🏫 *A low average of commits per pipeline may indicate an issue in developer analysis.*]: #

	- [ ] The latest pipeline cleanly passes all jobs.
	- [ ] The number of pipelines leans towards a minimum.
	- [ ] The number of commits per pipeline leans towards a maximum.

- [ ] **Readiness:** The changes can be merged.
- [ ] **Activity:**
	- [ ] The merge request was created in draft status.
	- [ ] The merge request was in draft status during subsequent pushes.

### Code Health

- [ ] **Commits**:

    [> 🏫 *Commits with large changes indicate the developer is thinking locally rather than globally.*]: #

    [> 💡 *Sometimes, the path to a solution isn't clear, and a messy commit log is inevitable. A good development strategy may use a "draft branch" where the developer can be as messy as they want. But once they know the final solution, They'll create a new branch for publishing. Then, commit small, clean changes until there are no diffs between the draft branch and the publishing branch. Doing this will often reveal unconsidered issues, too.*]: #

    - [ ] Commit changes are small.
    - [ ] Commit messages are informative.
    - [ ] Documentation is changed in the same commit as associated functional changes.

- [ ] **Best Practices:**

    [> 🏫 *Smelly code indicates the developer didn't review the final diffs before creating the merge request or inexperience.*]: #

    - [ ] Changes are easy to reason about.
    - [ ] Complex logic checks are extracted to variables.
    - [ ] Symbols have meaningful names.
    - [ ] Ignored linting rules are provided an exception.

- [ ] **Tests:**

    [> 🏫 *If the diffs touch `if` statements, there should usually be an associated test.*]: #

    - [ ] Changes to business logic are covered.
    - [ ] Tests are verbose.
    - [ ] Test specs are partitioned appropriately.
    - [ ] Test spec descriptions are informative.
    - [ ] Test spec descriptions are free of typos.

- [ ] **Documentation:**

    [> 💡 *Documentation can take form in descriptive naming, comments, helpdocs, test specs, and READMEs.*]: #

    - [ ] Changes to business logic have associated documentation changes.
    - [ ] Documentation is changed at an appropriate level of abstraction.

### Outcomes

[> 💡 *Trust, but verify. A recording may be informative, but it isn't always sufficient.*]: #

[> 🛑 *Reproduce issues at least once on a development server.*]: #

[> 🛑 *Reproduce desired behaviors on a development server after every significant push to the remote.*]: #

- [ ] The solution produces the desired outcomes.

[⏭️ BACK TO TOP: README](README.md)
