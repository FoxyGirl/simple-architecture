---
description: Break down a PRD into independent implementation phases and save the development plan in features/.
---

# Implementation Plan Generator

Create an implementation plan based on the PRD file specified in the arguments:

$ARGUMENTS

## Workflow

### 1. Read the PRD

- Treat the argument as the path to the PRD file.
- Read the complete PRD before planning.
- Do not rely on the filename or a partial description instead of the actual PRD content.
- If the file does not exist or cannot be read, report the problem and stop.
- If the PRD is incomplete or ambiguous, ask clarifying questions before creating the plan.

### 2. Analyze the project

- Inspect the relevant project structure and source files.
- Identify existing architecture, technologies, dependencies, and constraints.
- Use the actual project structure when identifying affected areas.
- Do not invent technical requirements or implementation details.

### 3. Generate the implementation plan

Create a sequence of independent implementation phases.

The plan must cover every requirement and acceptance criterion from the PRD.

### 4. Generate the output filename

- Extract the 3-digit prefix `{NNN}` and `{feature-name}` from the input PRD filename (`{NNN}-prd-{feature-name}.md`).
- Keep the feature name in English and kebab-case.
- Save the plan using the following naming convention:

`features/{NNN}-plan-{feature-name}.md`

- Check whether the target file already exists.
- Never overwrite an existing plan without explicit permission.

## Plan Structure

# Plan: {feature name}

**PRD:** {path to the source PRD}

**Date:** {current date}

## Implementation Phases

Each phase must follow this structure:

### Phase 1: {phase name}

If a short feature name is explicitly provided, use:

`### Phase 1-{short_feature_name}: {phase name}`

**Goal:** What this phase delivers.

**Affects:** backend / frontend / database

**Tasks:**

- [ ] Task 1
- [ ] Task 2

**Tests:**

- [ ] Test 1
- [ ] Test 2

**When ready:**

Specific, verifiable completion criteria.

**Acceptance Criteria:**

- [ ] Criterion 1
- [ ] Criterion 2

### Phase 2: {phase name}

...

## Phasing Rules

- Each phase must produce a workable result.
- Phases must be independent enough to stop after any completed phase.
- The first phase must represent the minimum work path (Tracer Bullet).
- Each phase must contain no more than seven tasks.
- Backend and frontend implementation of the same feature must be placed in separate phases.
- Every phase must include tests covering its functionality.
- When feasible, E2E tests should be created before implementation of the corresponding phase.
- Each phase must have a clear definition of Done and verifiable acceptance criteria.
- Order phases according to dependencies.
- Do not create artificial phases just to increase their number.

## Rules

- Read the PRD carefully.
- Cover all PRD requirements and acceptance criteria.
- Do not add functionality or requirements that are not present in the PRD.
- Do not invent technical details.
- Prefer concrete, actionable tasks over vague descriptions.
- Tasks describe implementation work; acceptance criteria describe expected results.
- If the PRD is incomplete, ask questions before creating the plan.
- Keep the plan concise and focused.

## Final Verification

Before saving:

- Verify that all PRD acceptance criteria are covered.
- Verify that every phase produces a workable result.
- Verify that phase dependencies are respected.
- Verify that each phase has tests and clear completion criteria.
- Verify that no phase contains more than seven tasks.

Save the completed plan and report its path.
