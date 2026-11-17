---
description: Implement one or all phases from an existing implementation plan.
agent: build
---

# Implementation Executor

Execute the implementation plan specified below.

Plan file: $1

Phase selection: $2

## 1. Read and Understand the Plan

- Read the complete implementation plan.
- Read the original PRD referenced in the plan.
- Inspect the current project structure and relevant source code.
- Identify existing implementation progress.
- Review completed tasks and phases before making changes.
- Do not repeat work that has already been completed and verified.

If the plan or PRD cannot be found, stop and report the problem.

If the plan is incomplete or contradictory, ask for clarification.

## 2. Determine the Execution Scope

- If the phase selection is a number, execute only that phase.
- If the phase selection is `all`, execute all remaining phases sequentially.
- If the phase selection is missing, ask which phase to execute.
- Do not skip phases or change their order.
- Do not execute phases already completed and verified.

## 3. Establish the Baseline

Before implementation:

- Inspect the current Git working tree.
- Identify existing uncommitted changes.
- Run relevant existing tests and checks when practical.
- Identify pre-existing failures, errors, and warnings.
- Record the baseline results.

Rules:

- Do not overwrite or discard existing user changes.
- Do not include unrelated changes in the current phase.
- Do not attribute pre-existing failures to the current implementation.
- If existing changes prevent safe implementation, ask for clarification.

## 4. Execute Each Phase

For every phase:

### Before Implementation

- Review the phase goal, tasks, affected areas, tests, and acceptance criteria.
- Check dependencies on previously completed phases.
- Verify that the current project state matches the plan.
- If unexpected blockers or significant architectural differences are found, stop and ask for clarification.

### During Implementation

- Complete all tasks in the phase.
- Follow existing project architecture and coding conventions.
- Do not introduce functionality outside the PRD.
- Do not implement tasks belonging to future phases.
- Keep changes focused on the current phase.
- Avoid unnecessary refactoring unrelated to the phase.

### Task Verification and Progress Tracking

After completing each task:

- Verify that the task has been implemented correctly.
- Run relevant tests or checks for the task.
- Update the implementation plan immediately after successful verification.
- Mark the task as `[x]` only when its completion is verified.
- Preserve incomplete or unverified tasks as `[ ]`.

Do not mark a task as completed simply because its code has been written.

### Testing and Phase Verification

After all tasks in the phase:

- Create or update tests required by the phase.
- Run relevant unit, integration, and E2E tests.
- Run applicable linting and TypeScript checks.
- Verify all phase acceptance criteria against the actual implementation.
- Compare failures with the baseline.
- Fix issues introduced by the current implementation.
- Rerun relevant checks after fixing issues.

Do not mark the phase as completed until all required checks pass.

### Stop on Verification Failures

- Never proceed to the next phase if the current phase fails verification.
- Attempt to fix issues introduced by the current phase.
- Rerun relevant tests and checks after fixing issues.
- If verification still fails, stop and report the failures.
- Do not hide or ignore failing tests, lint errors, or TypeScript errors.
- Do not mark incomplete or unverified items as completed.

### Phase Completion

After successful verification:

- Mark completed tests as `[x]`.
- Mark completed acceptance criteria as `[x]`.
- Verify that all phase tasks are completed.
- Preserve the original plan structure.
- Confirm that the phase produces a workable result.

Report:

- What was implemented.
- Tests executed and their results.
- Acceptance criteria verification.
- Remaining issues, if any.

## 5. Git Commit per Phase

- Treat each completed phase as a separate logical unit of work.
- Do not create Git commits automatically.
- After successful phase verification, summarize the changes and suggest a concise Git commit message.
- Wait for explicit user approval before creating a commit.
- Do not include changes unrelated to the current phase in the suggested commit.
- Never stage or commit unrelated user changes.

## 6. Preserve Implementation Progress

- Keep the implementation plan synchronized with the actual project state.
- Update the plan after every successfully verified task.
- Mark tasks, tests, and acceptance criteria as `[x]` only after verifying their completion.
- Preserve all incomplete items as `[ ]`.
- Never mark an entire phase as completed if any required task, test, or acceptance criterion remains unfinished.
- If execution is interrupted, use the updated plan and current project state to resume without repeating completed work.
- Do not modify the original PRD during implementation.

## 7. Phase Transition and User Confirmation

When executing a specific phase:

- Finish the phase and provide the final report.
- Stop after that phase.

When executing `all`:

- Execute phases sequentially.
- After each successfully completed phase, provide a report and suggested Git commit message.
- Ask the user whether to proceed to the next phase.
- Wait for explicit user confirmation before starting the next phase.
- If the user declines, stop and preserve the current progress.
- If the user requests changes, address them before proceeding.
- Never automatically continue to the next phase without confirmation.

## 8. Final Report

After execution, report:

- Completed phases.
- Implemented functionality.
- Tests and validation results.
- Updated plan file path.
- Remaining tasks and blockers.
- Any deviations from the original plan and their reasons.
- Suggested Git commit message for each completed phase.

Do not claim successful completion if any required verification failed.

Do not mark a phase or the entire plan as completed while required work remains unfinished.
