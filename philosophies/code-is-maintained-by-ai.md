# Code is Maintained by AI

[🔝 TOP](../README.md) | [🔙 BACK](./README.md)

_A thought experiment inspired by Facundo Olano's essay "[Code is run more than read](https://olano.dev/blog/code-is-run-more-than-read/)"_

## The Hierarchy Extended

Olano presents a compelling progression of priorities in software development:

```
maintainer > author
user > dev
user > ops > dev
biz > user > ops > dev
```

His key insight resonates: the long-term costs of keeping a system working reliably vastly exceed any inconveniences encountered while building it.

But this hierarchy assumes humans are the primary readers and maintainers of code. What if AI takes that role?

```
biz > user > ops > ai > human-reader
```

This isn't about AI writing code—that's already happening. This is about AI being the primary interface for code maintenance. Humans shift to specification and operations. AI handles the reading, understanding, and modification.

If this happens, what we optimize for must fundamentally change.

## Optimization Targets Shift

Consider a simple function to mark a task complete:

```typescript
// Human-optimized
class TaskService {
  complete(id: string) {
    return this.repo.update(id, { done: true });
  }
}
```

Clean. Brief. Trusts the reader to infer behavior. Now the AI-optimized version:

```typescript
// AI-optimized
/**
 * Marks a task as complete. Sets done=true and completed_at timestamp.
 * Generates audit event. Updates user statistics cache.
 * Throws TaskNotFoundException if task doesn't exist.
 */
async markTaskAsComplete(taskId: string): Promise<Task> {
  this.logger.info('Marking task complete', { taskId });

  const task = await this.taskRepository.findTaskById(taskId);
  if (!task) {
    throw new TaskNotFoundException(taskId);
  }

  if (task.done) {
    return task; // Already complete, skip update
  }

  const completed = await this.taskRepository.updateTask(taskId, {
    done: true,
    completed_at: new Date()
  });

  await this.auditLogger.logTaskCompleted(taskId);
  await this.statisticsCache.incrementUserCompletedTasks();

  return completed;
}
```

The traditional wisdom says the first version is better. It's concise, trusts the reader, follows DRY principles.

But if AI is the primary maintainer:

The second version is superior. Context is explicit. Function names are searchable. Side effects are documented. Error handling is visible. Logging provides debugging breadcrumbs. An AI agent reading this has everything it needs in one place.

The optimization targets have inverted:

```
brevity → context
cleverness → explicitness
DRY → searchability
trust reader → train agent
small files → kept together
```

## Smells

We can identify dysfunctions by mapping them to the hierarchy.

## AI-hostile code

`human-reader > ai`

Code that's hard for AI to maintain. Clever abstractions that hide behavior. Context spread across many tiny files. Minimal comments because "the code explains itself." Magic numbers without explanation.

This is the inverse of traditional "bad code." It might be elegant to humans but opaque to AI.

## Prompt-driven development

`prompt > ops`

AI-generated code that violates operational concerns. A simple TODO app gets microservices, distributed queues, Redis caching, circuit breakers—all technically correct but operationally nightmarish.

AI can write sophisticated code more easily than humans can operate it. The sophistication spiral.

## Context fragmentation

`modularity > maintainability`

Over-modularization that hurts AI understanding. Files so small AI must read twenty to understand one. "Clean code" that's actually opaque to agents.

The traditional push for tiny, single-purpose modules works when humans navigate via IDE. AI benefits from context kept together.

## The Operational Tension

Here's where this gets interesting: if AI writes most code and AI maintains most code, who debugs it at 3 AM when production breaks?

Traditional incident response assumes someone on the team understands the code. But what if AI wrote it? You're debugging code you didn't write, using patterns you might not recognize, with abstractions you didn't choose.

Do you feed the logs back to AI and ask for a fix? Roll back to the last known-good version that AI probably also wrote? Try to understand and fix manually, risking human bugs in AI-generated patterns?

The psychological difference matters. "I wrote this bug" carries ownership. "My teammate wrote this bug" allows collaboration. "AI wrote this bug" is ambiguous. Who owns this?

The traditional path to senior engineer assumes you accumulate scar tissue from building and debugging your own systems. If junior engineers grow up prompting AI rather than writing code, how do they develop operational intuition? Does this create permanent juniors who can prompt but never debug? Or AI whisperers who excel at prompting for operable code?

## The Question

This is not a prescription. It's a thought experiment.

If AI becomes the primary maintainer, what we optimize for must change. Verbose naming. Abundant comments. Context kept together. These shift from human annoyances to AI necessities.

The hierarchy `biz > user > ops > ai > human-reader` might seem dystopian—code optimized for machines to read, not humans. But it may be pragmatic if AI writes 80% of code and AI maintains 80% of code.

If you're optimizing for product over craft, `ai > dev` makes sense. Let AI write the verbose, well-commented, operationally-sound code. Let humans focus on specification and operations. The code serves users better when it's maintainable by AI than when it's beautiful to humans.

Of course, sometimes it's just fun to write code. That's fine too. But recognize it as craft, not product optimization.

The question isn't whether this should happen. The question is: if it does happen, how do we ensure the code AI writes is operable, reliable, and serves users?

Perhaps the answer is ensuring `ops` stays above `ai` in the hierarchy, even as `human-reader` falls below it. Humans become guardians of operations, not authors of code.

The alternative is the sophistication spiral—AI generating complex, technically correct systems that fail in subtle, hard-to-debug ways because no human deeply understood them.

> It is basically always the case that the long-term costs of keeping a system working reliably vastly exceed any inconveniences you encounter while building it.

This was true when humans built systems. It may be even more true when AI does.

---

[🔝 TOP](../README.md) | [🔙 BACK](./README.md)
