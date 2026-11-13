---
name: create-pr
description: Analyze Git branch changes and generate a concise Pull Request title and description using Gitmoji. Use when preparing or reviewing a Pull Request.
---

# PR Generator

Generate a Pull Request title and description for the current for the current branch compared to a target base branch..

## Arguments

The target base branch is provided by the calling command or user.

- Use the explicitly provided branch.
- If no branch is provided, default to `dev`.

## Instructions

1. Identify the current Git branch.
2. Identify the target branch from the user's argument, or use `dev` by default.
3. Compare the current branch against the target branch.
4. Analyze the overall purpose and scope of the changes.
5. Review the actual diff, not just commit messages.
6. Generate a concise PR title and description.
7. Prefix the title with the most appropriate Gitmoji.
8. Use imperative mood for the title.

## Git Analysis

Use Git commands to inspect the changes:

- `git status --short`
- `git branch --show-current`
- `git diff <target-branch>...HEAD`
- `git log <target-branch>..HEAD --oneline`

Focus on changes introduced by the current branch.

If the target branch does not exist locally, check whether the corresponding remote-tracking branch exists.

Do not fetch or modify the repository.

Do not publish the PR independently. Return the generated title and description to the calling workflow.

## PR Title

Format:

<gitmoji> <short imperative summary>

Example:

✨ Add meeting detail page shell

## PR Description

### Summary

- ...
- ...
- ...

Briefly explain the purpose of the PR.

- Summarize instead of listing every changed file.
- Keep the description under 10 bullet points.
- Focus on the overall feature and its impact.

### Test plan

Describe how the changes were verified, if applicable.

- [ ] ...

Do not claim that tests were executed unless there is evidence that they were run.

## Guidelines

- Focus on the overall feature rather than individual commits.
- Keep the description concise.
- Avoid listing every modified file.
- Ignore formatting-only changes unless they are the primary purpose.
- Do not invent functionality, implementation details, or test results.
