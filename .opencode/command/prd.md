---
description: Create a Product Requirements Document (PRD) for a feature and save it in the features directory.
---

# PRD Generator

Create a PRD (Product Requirements Document) for the following feature:

$ARGUMENTS

## Workflow

### 1. Understand the requirements

- Analyze the feature description.
- Identify the user problem, expected behavior, and desired outcome.
- If the description is too short or ambiguous, ask clarifying questions before creating the document.
- Ask only questions necessary to understand the feature.
- Do not create a PRD until the requirements are sufficiently clear.

### 2. Analyze the project

- Inspect the existing project structure and relevant source files when necessary.
- Identify technical limitations that may affect the feature.
- Do not invent architectural constraints or implementation details.
- If something is unknown, explicitly mention it rather than making assumptions.

### 3. Generate the filename

- Translate the feature name into English.
- Convert it to kebab-case.
- Use the following naming convention:

`features/prd-{feature-name}.md`

- Check whether the target file already exists.
- Never overwrite an existing PRD without explicit permission.
- Create the `features` directory if it does not exist.

### 4. Create the PRD

Use the following document structure:

# PRD: {feature name}

**Date**: {current date}
**Status**: Draft

## Purpose

One or two sentences explaining what the user needs and why.

## User Scenarios

- User {action} -> {Result}

## In scope

A specific list of functionality included in this feature.

## Out of scope

A specific list of functionality explicitly excluded from this iteration.

## Technical limitations

Known technical limitations, dependencies, or constraints that need to be considered.

If no limitations are identified, state that explicitly.

## Acceptance Criteria

- [ ] Criteria 1
- [ ] Criteria 2

## Rules

- Be specific. Avoid unnecessary descriptions and fluff.
- Acceptance criteria must be objectively verifiable.
- Describe what the feature must do, not how to implement it.
- Do not invent requirements, user scenarios, or technical constraints.
- Keep the document focused on the requested feature.
- Use the same language as the feature description for the PRD content.
- Keep the filename in English and kebab-case.

### 5. Final verification

- Verify that all required sections are present.
- Ensure acceptance criteria are testable.
- Ensure the document does not contain contradictory requirements.
- Save the completed document to the generated path.
- Report the created file path to the user.
