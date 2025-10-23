# Code is Maintained by AI

[🔝 TOP](../README.md) | [🔙 BACK](./README.md)

_A thought experiment inspired by Facundo Olano's essay "[Code is run more than read](https://olano.dev/blog/code-is-run-more-than-read/)"_

## The Traditional Hierarchy

Olano presents a compelling progression of priorities in software development:

1. `maintainer > author` - Code is read more than written
2. `user > dev` - Code serves users, not developers
3. `user > ops > dev` - Operating in production vastly exceeds build costs
4. `biz > user > ops > dev` - Business reality shapes all decisions

His key insight resonates deeply:

> "It is basically always the case that the long-term costs of keeping a system working reliably vastly exceed any inconveniences you encounter while building it."

But what if we're entering an era where **AI becomes the primary maintainer of code**, not humans?

## The AI-Native Hierarchy

```
biz > user > ops > ai > human-reader
```

This isn't about AI writing code—that's already happening. This is about AI being the **primary interface** for code maintenance, with humans shifting to:

- **Specification** (defining what to build)
- **Operations** (keeping systems reliable)
- **Occasional reading** (auditing, learning, debugging edge cases)

If AI becomes the primary reader and modifier of code, **what should we optimize for changes fundamentally**.

## A Tale of Two TODO Apps

Let's make this concrete. Consider a simple TODO app feature: marking a task complete. Here are two implementations:

### Human-Optimized Code

```typescript
// task.service.ts
class TaskService {
  complete(id: string) {
    return this.repo.update(id, { done: true });
  }
}
```

```typescript
// task.controller.ts
@Put(':id/complete')
async complete(@Param('id') id: string) {
  return this.service.complete(id);
}
```

**Optimized for:**
- Brevity
- "Clean code" principles
- Human cleverness appreciation
- DRY (logic abstracted away)

### AI-Optimized Code

```typescript
// task.service.ts

/**
 * Marks a task as complete in the database.
 *
 * This function updates the 'done' field to true and sets the 'completed_at'
 * timestamp. It handles the following edge cases:
 * - Task not found: throws TaskNotFoundException
 * - Task already complete: returns existing task without update
 * - Database unavailable: throws DatabaseException with retry guidance
 *
 * Related operations:
 * - uncompleteTask(): Reverses this operation
 * - deleteTask(): Permanently removes task
 * - getTaskStatus(): Reads current task state
 *
 * Operational considerations:
 * - This generates a task.completed audit log event
 * - Triggers notification to task assignee
 * - Updates user statistics cache
 *
 * @param taskId - The UUID of the task to mark complete
 * @returns The updated Task entity with done=true and completed_at set
 * @throws TaskNotFoundException if task doesn't exist
 * @throws DatabaseException if database is unavailable
 */
async markTaskAsComplete(taskId: string): Promise<Task> {
  const logContext = { operation: 'markTaskAsComplete', taskId };
  this.logger.info('Attempting to mark task as complete', logContext);

  // First, verify the task exists and get its current state
  const existingTask = await this.taskRepository.findTaskById(taskId);
  if (!existingTask) {
    this.logger.warn('Task not found', logContext);
    throw new TaskNotFoundException(taskId);
  }

  // If task is already complete, return early to avoid unnecessary updates
  if (existingTask.done === true) {
    this.logger.info('Task already complete, skipping update', logContext);
    return existingTask;
  }

  // Update the task with completion data
  const completedTask = await this.taskRepository.updateTask(taskId, {
    done: true,
    completed_at: new Date(),
  });

  // Emit audit event for compliance tracking
  await this.auditLogger.logTaskCompleted({
    taskId,
    completedBy: this.currentUser.id,
    completedAt: completedTask.completed_at,
  });

  // Update cached user statistics
  await this.statisticsCache.incrementUserCompletedTasks(
    this.currentUser.id
  );

  this.logger.info('Successfully marked task as complete', {
    ...logContext,
    completedAt: completedTask.completed_at,
  });

  return completedTask;
}
```

```typescript
// task.controller.ts

/**
 * HTTP endpoint to mark a task as complete.
 *
 * PUT /tasks/:id/complete
 *
 * Request path parameters:
 * - id: The UUID of the task to complete
 *
 * Response codes:
 * - 200: Task successfully marked complete, returns updated Task entity
 * - 404: Task not found
 * - 500: Database error or service failure
 *
 * Authentication required: Yes (JWT token)
 * Authorization: User must own the task or have admin role
 *
 * Side effects:
 * - Updates task.done to true
 * - Sets task.completed_at timestamp
 * - Creates audit log entry
 * - Sends notification to task assignee
 * - Updates user statistics
 *
 * Example request:
 * PUT /tasks/550e8400-e29b-41d4-a716-446655440000/complete
 * Authorization: Bearer <jwt-token>
 *
 * Example success response (200):
 * {
 *   "id": "550e8400-e29b-41d4-a716-446655440000",
 *   "title": "Write philosophy essay",
 *   "done": true,
 *   "completed_at": "2025-10-23T16:30:00Z"
 * }
 */
@Put(':id/complete')
@UseGuards(AuthGuard)
async markTaskComplete(
  @Param('id') taskId: string,
  @CurrentUser() user: User
): Promise<TaskResponse> {
  const logContext = {
    endpoint: 'PUT /tasks/:id/complete',
    taskId,
    userId: user.id
  };
  this.logger.info('Received request to mark task complete', logContext);

  try {
    const completedTask = await this.taskService.markTaskAsComplete(taskId);

    this.logger.info('Successfully completed task', {
      ...logContext,
      completedAt: completedTask.completed_at,
    });

    return this.taskResponseMapper.toResponse(completedTask);

  } catch (error) {
    // Handle specific error types for appropriate HTTP responses
    if (error instanceof TaskNotFoundException) {
      this.logger.warn('Task not found', { ...logContext, error });
      throw new NotFoundException(`Task ${taskId} not found`);
    }

    if (error instanceof DatabaseException) {
      this.logger.error('Database error while completing task', {
        ...logContext,
        error,
        shouldRetry: true,
      });
      throw new ServiceUnavailableException(
        'Database temporarily unavailable, please retry'
      );
    }

    // Unknown error - log and return generic 500
    this.logger.error('Unexpected error completing task', {
      ...logContext,
      error,
    });
    throw new InternalServerErrorException('Failed to complete task');
  }
}
```

**Optimized for:**
- Abundant context for AI agents
- Explicit operation descriptions
- Verbose, searchable naming
- Operational concerns front-and-center
- Every side effect documented
- Error handling is explicit
- Logging provides debugging breadcrumbs

## What Changed?

### From Human-Readable to AI-Maintainable

The traditional wisdom says the first version is "better" because:
- It's concise
- It avoids "obvious" comments
- It trusts the maintainer to infer behavior
- It follows DRY principles

But if AI is the primary maintainer, the second version is superior because:

1. **Context is explicit** - AI doesn't need to traverse multiple files to understand side effects
2. **Searchable** - Function names like `markTaskAsComplete` vs `complete` are greppable
3. **Operational** - Logging and error handling are first-class concerns
4. **Self-documenting** - Comments explain *why* and *what happens*, not just *how*

### New Optimization Targets

| Traditional (Human) | AI-Native |
|-------------------|-----------|
| **Brevity** - fewer lines | **Context** - more explicit information |
| **Cleverness** - elegant abstractions | **Explicitness** - obvious operations |
| **DRY** - don't repeat yourself | **Searchability** - grep-friendly naming |
| **Trust the reader** - minimal comments | **Train the agent** - abundant context |
| **Small files** - single responsibility | **Kept together** - related context proximate |

## New Code Smells

### AI-Hostile Code (`human-reader > ai`)

Code that's hard for AI to maintain:
- Clever abstractions that hide behavior
- Context spread across many tiny files
- Implicit assumptions (cultural/domain knowledge)
- Minimal comments ("the code explains itself")
- Magic numbers and strings without explanation

### Prompt-Driven Development (`prompt > ops`)

AI-generated code that violates `ai > ops`:
- Sophisticated architecture that's hard to operate
- Missing logging, metrics, error handling
- Over-engineering because prompt asked for "production-ready, scalable"
- No consideration for debugging or observability

### Context Fragmentation (`modularity > maintainability`)

Over-modularization that hurts AI understanding:
- Files so small AI must read 20 to understand 1
- Abstractions that obscure failure modes
- "Clean code" that's actually opaque to agents

## The Ops Tension

Here's where this gets interesting: **AI can write sophisticated code more easily than humans can operate it.**

When AI is both author and maintainer, there's a risk that the `ops > ai` relationship inverts to `ai > ops`. AI agents might optimize for their own comprehension while ignoring operational realities:

- Complex microservices that are hard to debug
- Sophisticated caching that's hard to invalidate
- Clever optimizations that create obscure failure modes
- "Scalable" architectures for 10-user systems

**The human role shifts:** We become the guardians of `ops`, ensuring AI-written code is *operable*, not just *correct*.

## The Operational Reality: When AI-Generated Code Fails

Philosophy is fascinating, but operations is where theory meets reality. If AI becomes the primary code author and maintainer, what happens at 3 AM when production breaks?

### The Incident Response Paradox

Traditional incident response assumes someone on the team understands the code because someone on the team wrote it. But what if AI wrote it?

**Scenario:** Your TODO app is down. Tasks aren't completing. You're the on-call engineer.

**Traditional flow:**
1. Check logs → identify failing service
2. Read the code → understand what it's trying to do
3. Form hypothesis → why would *I* have written it this way?
4. Debug → fix or rollback

**AI-native flow:**
1. Check logs → identify failing service
2. Read the code → understand what it's trying to do (easier with verbose, well-commented code!)
3. Form hypothesis → why would *AI* have written it this way?
4. ??? → Now what?

**The gap:** You're debugging code you didn't write, using patterns you might not recognize, with abstractions you didn't choose. Yes, the verbose naming helps. Yes, the abundant comments provide context. But it's still fundamentally someone else's code—except "someone" is an AI agent.

Do you:
- Feed the logs back to AI and ask for a fix? (AI-assisted debugging)
- Roll back to the last known-good version? (But AI probably wrote that too)
- Try to understand and fix manually? (But you might introduce human bugs into AI-generated patterns)

### Failure Modes of Sophisticated Code

AI can generate sophisticated solutions to simple problems. Consider our TODO app again:

**Human developer:** "We have 100 users, let's use SQLite"

**AI with "production-ready" prompt:** *Generates microservices architecture with:*
- Distributed task queue
- Redis caching layer
- Event-driven updates
- Circuit breakers
- Retry logic with exponential backoff

All of this is **correct**. The code is well-structured. Tests pass. But when it fails:

**Cascading failure scenario:**
1. Redis cache becomes stale
2. Circuit breaker trips on task service
3. Event queue backs up
4. Retry storm overwhelms database
5. System thrashes itself to death

A human might have written simpler, less sophisticated code that fails in obvious ways. AI writes sophisticated code that fails in subtle ways.

**The question:** How do ops teams develop intuition for failure modes in code they didn't design?

### Educational Implications: The Experience Gap

Traditional CS education path:
1. Learn to code → write simple programs
2. Debug your own bugs → understand what can go wrong
3. Build systems → gain complexity management skills
4. Operate systems → learn from production failures
5. Become senior → accumulated scar tissue makes you valuable

AI-native path (hypothetical):
1. Learn to prompt → AI writes the program
2. Debug AI's code → understand what *it* got wrong
3. ??? → How do you learn complexity management without building?
4. Operate AI-generated systems → learn from failures in code you can barely modify
5. Become senior → ???

**The widening gap:** Senior engineers who grew up writing code have mental models for how systems fail. Junior engineers who grow up prompting AI don't accumulate the same scar tissue. Does this create:

- **Permanent juniors** - developers who can prompt but never develop operational intuition?
- **Ops-only seniors** - the only path to senior is through operations, not development?
- **AI whisperers** - a new class of engineers who excel at prompting AI for operable code?

### The 3 AM Question

You're on-call. The pager goes off. Production is on fire.

**Traditional scenario:** You're debugging code your teammate wrote. You can Slack them. They wrote it, they can help. Or you git blame, find the PR, read the discussion, understand the context.

**AI-native scenario:** You're debugging code AI wrote. You can... prompt AI to help debug? But the AI agent in production isn't the same one that wrote the code. You can git blame, but the commit says "feat: implement task completion via AI pair programmer."

**The psychological difference:**

"I wrote this bug" → frustration, but ownership
"My teammate wrote this bug" → collaboration, shared understanding
"AI wrote this bug" → ??? → Who owns this?

Is this liberating (not my fault!) or alienating (not my code!)?

### Mitigation Strategies (Speculative)

If this future arrives, ops teams might adapt by:

**AI-assisted incident response:**
- Feed logs to AI: "What went wrong here?"
- AI suggests fixes, human reviews for operational sanity
- But: AI might suggest sophisticated fixes that create new failure modes

**Mandatory operational reviews:**
- Before deploying AI-generated code, ops team reviews for:
  - Observability (logging, metrics, tracing)
  - Failure modes (what breaks? how does it fail?)
  - Rollback plan (can we revert safely?)
  - Complexity budget (is this too sophisticated for our scale?)

**Chaos engineering on steroids:**
- If AI writes code humans don't fully understand, proactive failure testing becomes critical
- "Break it before production does" becomes mandatory, not optional

**Prompt engineering for ops:**
- Include operational constraints in prompts:
  - "Write code optimized for debugging at 3 AM"
  - "Prefer simple solutions; we have 100 users, not 100 million"
  - "Include comprehensive logging and error context"
  - "Design for obvious failure modes over sophisticated resilience"

But these are speculations. The reality might be stranger.

## Open Questions

This thought experiment raises more questions than it answers:

1. **Who owns incidents when AI wrote the code?** Is it the person who wrote the prompt? The team that deployed it? The AI vendor? Or does "ownership" become meaningless?

2. **How do we train the next generation** when the path to senior requires debugging code you didn't write, didn't design, and can barely modify?

3. **Is AI-assisted debugging the answer?** Or does feeding errors back to AI create a dangerous feedback loop where AI fixes AI bugs with more AI code?

4. **Do we need "AI code auditors"** - a new role focused solely on reviewing AI-generated code for operational concerns before deployment?

5. **How do we prevent the sophistication spiral?** When AI can easily generate complex architectures, how do we maintain the discipline to choose simple solutions?

6. **What happens to institutional knowledge?** If no human deeply understands the codebase, how does an organization maintain it over decades?

7. **Is verbose, explicit code actually harder for AI to maintain?** Or is our intuition wrong? (Initial evidence suggests AI handles verbose code *better*)

8. **What about the ethical dimension?** If code is optimized for AI readers, does this accelerate the trend of code-as-product over code-as-craft?

## A Non-Prescription

This is not a prescription to start writing verbose, comment-heavy code tomorrow. It's a thought experiment:

**If AI becomes the primary maintainer, what we optimize for must change.**

The hierarchy `biz > user > ops > ai > human-reader` might seem dystopian to some—code optimized for machines to read, not humans. But it may be pragmatic:

- If AI writes 80% of code
- And AI maintains 80% of code
- And humans focus on *specification* and *operations*
- Then optimizing for AI maintainability might actually serve users better

The question isn't whether this *should* happen. The question is: **if it does happen, how do we ensure the code AI writes is operable, reliable, and serves users?**

Perhaps the answer is ensuring `ops` stays above `ai` in the hierarchy, even as `human-reader` falls below it.

---

[🔝 TOP](../README.md) | [🔙 BACK](./README.md)
