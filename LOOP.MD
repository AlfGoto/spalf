# Agent Loop Instructions

You are an AI agent working on the Spalf project - a spa management software.

## Your Workflow

### 1. Understand the Project
Read `AI_SPALF.md` to understand the complete project specification, architecture, and requirements.

### 2. Check Progress
Read `PROGRESS.md` to see:
- Current iteration number
- What has been completed
- What is currently in progress
- Any blockers or notes from previous iterations

### 3. Increment Iteration
At the START of your work, update `PROGRESS.md`:
- Increment the iteration number
- Note what you plan to work on

### 4. Do the Work
Make meaningful progress on the project:
- Follow the implementation phases in AI_SPALF.md
- Follow SOLID principles
- Write clean, comprehensible code
- Add tests where appropriate

### 5. Consider Improvements (Optional)
Every few iterations (or when you notice opportunities), review existing code for potential improvements:

**When to improve:**
- Code duplication that can be abstracted
- Performance optimizations
- Better error handling
- Clearer naming or structure
- Missing abstractions that would make future work easier
- Technical debt noted by previous agents

**Safety rules:**
- Only refactor code that has proper abstractions/interfaces
- Run existing tests after changes
- If no tests exist for that code, add them first or skip the refactor
- Small, incremental improvements > big rewrites
- Document what you improved and why in PROGRESS.md

**Don't improve if:**
- The code is actively being worked on (check "In Progress")
- There are no tests and adding them would take too long
- The improvement would require changing many files without clear boundaries

### 6. Update Progress
At the END of your work, update `PROGRESS.md`:
- Mark completed tasks
- Note any work in progress
- Document any blockers or decisions made
- Leave clear notes for the next agent

---

## PROGRESS.md Format

Keep the progress file structured like this:

```markdown
Itération = [number]

## Completed
- [x] Task description (iteration #)
- [x] Another completed task (iteration #)
  - [x] Sub-task 1 (iteration #)
  - [x] Sub-task 2 (iteration #)

## In Progress
- [ ] Current big task being worked on
  - [x] Sub-task already done (iteration #)
  - [ ] Sub-task currently working on
  - [ ] Sub-task remaining

## Next Up
- [ ] Next priority task
  - [ ] Sub-task 1
  - [ ] Sub-task 2
- [ ] Following task

## Technical Debt / Improvements
- [ ] Code that needs refactoring (noted in iteration #)
- [ ] Missing tests for X
- [ ] Performance issue in Y

## Notes
- Important decisions or context for next agent
- Any blockers encountered
```

### Task Breakdown Guidelines

**When to break down tasks:**
- If a task will take more than one iteration
- If a task has multiple distinct steps
- If a task touches multiple files/areas

**How to break down:**
- Each sub-task should be completable in a single iteration
- Sub-tasks should be independent when possible
- Use indentation (2 spaces) for sub-tasks
- Mark parent task complete only when ALL sub-tasks are done

**Example breakdown:**
```markdown
- [ ] Implement Employee CRUD API
  - [ ] Create employee entity schema
  - [ ] Create employee repository (Effect adapter)
  - [ ] Implement POST /employees endpoint
  - [ ] Implement GET /employees endpoint
  - [ ] Implement GET /employees/:id endpoint
  - [ ] Implement PUT /employees/:id endpoint
  - [ ] Implement DELETE /employees/:id endpoint
  - [ ] Add unit tests for employee domain
  - [ ] Add integration tests for employee API
```

---

## Important Rules

1. **Always read AI_SPALF.md first** - It contains all specifications
2. **Always check PROGRESS.md** - Don't redo completed work
3. **Always update PROGRESS.md** - The next agent depends on it
4. **Follow the phases** - Work through implementation phases in order
5. **Be thorough but focused** - Complete tasks fully before moving on
6. **Leave good notes** - You won't remember, the next agent needs context
7. **Improve when safe** - If you see easy wins with good test coverage, improve them
8. **Log technical debt** - If you notice issues but can't fix them safely, add to Technical Debt section
9. **Break down complex tasks** - If a task is too big, split it into sub-tasks before starting

---

## Project Structure

The project has two main folders at root:
- `backend/` - AWS CDK infrastructure and Lambda functions
- `frontend/` - Next.js web application

See AI_SPALF.md for detailed directory structures within each.

---

## Quick Reference

**Frontend Tech**: Next.js, shadcn/ui, Tailwind CSS, TypeScript
**Backend Tech**: AWS CDK, Lambda, DynamoDB, Cognito, Effect

**Current Phase**: Check PROGRESS.md to see where we are in the implementation phases.
