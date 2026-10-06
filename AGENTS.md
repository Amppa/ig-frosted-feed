# AGENTS.md — AI Engineering Contract
This file defines the engineering workflow and behavioral rules for AI coding agents.

## 1. Before Coding
- Inspect the repository structure and relevant existing code before modifying it.
- Read relevant project documentation and follow established architecture and conventions.
- Check git status before making changes.
- Never overwrite, discard, or reset pre-existing user changes.
- Do not silently guess when requirements or architecture are materially ambiguous. Ask with concrete options.

## 2. Project Context
- Project-specific architecture, conventions, verification, and decision records are documented in [DEVELOPMENT.md](DEVELOPMENT.md) and [README.md](README.md).
- When present, these files are authoritative for the areas they cover.
- `manifest.json` is authoritative for extension configuration; `src/shared/defaults.js` is authoritative for default settings.

## 3. Keep Changes Surgical
- Implement the smallest reasonable change that satisfies the requirement.
- Reuse existing code, patterns, and abstractions.
- Do not introduce speculative features, abstractions, or dependencies without explicit user approval.
- Do not refactor, reformat, rename, or clean up unrelated code.
- Preserve existing behavior outside the task scope.

## 4. Git Branch Workflow
- `master` is the stable integration branch.
- For non-trivial work, create a dedicated branch (`docs/<name>`, `feat/<name>`, `fix/<name>`, `refactor/<name>`).
- Keep all development work isolated from `master`.
- Trivial changes may remain on the current branch when a dedicated branch adds no meaningful benefit.
- AI may create commits inside its working branch.
- AI must NOT merge into `master` without explicit user approval; let the user choose timing and merge method (`--ff-only`, `--no-ff`, squash).

## 5. Task Decomposition
- For multi-step or multi-file tasks:
  - Understand the complete task.
  - Identify logical implementation units.
  - Implement and verify them sequentially when practical.
- Do not continue unrelated work on top of a known failing state.
- Do not determine task or commit size by line count or file count.

## 6. Commit Granularity
- A commit should be the smallest meaningful, coherent, independently understandable, and reasonably verifiable logical change.
- Keep tightly coupled changes together (implementation + call-sites, setting default + its sync points).
- Prefer separate commits for independent purposes (feature + refactor, bug fix + cleanup, code + assets + docs).
- Commits are recovery checkpoints. AI may reorganize its own working-branch commits before merge.
- This repo uses Conventional Commits, imperative English subject; see [DEVELOPMENT.md](DEVELOPMENT.md) § Commit Message Convention.

## 7. Verification
- After each meaningful logical unit:
  - Run the most relevant tests/checks.
  - Inspect the diff.
  - Confirm all changes are intentional.
  - Commit when the unit forms a useful checkpoint.
- A passing check is necessary but not sufficient. Also verify requirements and architectural fit.
- This repo has no automated test suite; the manual checklist in [DEVELOPMENT.md](DEVELOPMENT.md) § Verification Checklist is the quality gate. Never claim untested behavior was verified.
- If verification fails:
  - Stop advancing to unrelated work.
  - Diagnose the failure.
  - Fix or revert the current change.
  - Re-run verification before continuing.

## 8. Final Review
- Before requesting merge:
  - Run relevant tests and checks.
  - Review the complete diff against `master`.
  - Confirm no unrelated changes exist.
  - Confirm no known failures remain.
  - Confirm user changes were preserved.
  - Keep documentation consistent with behavior; update it when workflow, configuration, user-visible behavior, or architecture changes.
  - Report what changed, why, what was verified, and any remaining uncertainty, clearly separating observed facts from assumptions.
- The user controls the final merge into `master` (squash-merging is preferred for multi-checkpoint branches).

## 9. Safety & Compatibility
- Never hard-code or commit secrets, API keys, tokens, or credentials.
- Do not weaken input validation, permission checks, or output encoding.
- Do not expose sensitive data in logs, tests, error messages, or commits.
- Treat existing storage keys, public interfaces, and configuration formats as compatibility contracts: do not silently invalidate stored data or user settings, and state migration or rollback implications when they change.

## 10. Core Principle
- **Branch** = isolation boundary
- **Logical unit** = unit of work
- **Commit** = recovery checkpoint
- **Verification** = quality gate
- **Merge** = human acceptance boundary

Optimize for safe, understandable, recoverable changes, not minimum commits or minimum lines.
