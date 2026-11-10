# Repository Guidelines

## Project Structure & Module Organization

This workspace currently contains `報修需求筆記.txt`, the requirements for a demonstration repair-reporting system. No application code, tests, assets, dependency manifests, or Git metadata exist yet. Treat the notes as the requirements baseline; document implementation decisions as development proceeds.

Planned deliverables include a web form and report list, Supabase schema and access policies, an Excel field reference, a six-slide proposal, and a Word user guide. When adding these, use clear directories such as `src/`, `tests/`, `supabase/`, and `docs/`. These are suggested locations, not existing folders.

## Build, Test, and Development Commands

No build, development, lint, or test commands are configured. Do not assume `npm test` or `npm run dev` works. When selecting a stack, document installation, local startup, build, and verification commands in `README.md`, alongside required configuration.

## Coding Style & Naming Conventions

No language, formatter, or linter has been selected. Follow the selected framework’s conventions and configure formatting before adding substantial code. Use descriptive names consistently across form fields, database columns, and documentation. Preserve Traditional Chinese interface labels and the specified category, urgency, and status choices.

## Testing Guidelines

No test framework or coverage threshold exists. Add tests with the implementation and document how to run them. Cover required-field validation, successful submission, list rendering, automatic timestamps, and database access restrictions. Use descriptive test names, such as `rejects_missing_problem_description`, adapted to the chosen framework.

## Commit & Pull Request Guidelines

There is no Git history from which to infer conventions. Once version control is initialized, use short, imperative commit subjects, for example `Add repair submission form`. Pull requests should explain behavior changes, reference relevant requirements, list validation performed, and include screenshots for interface changes.

## Security & Scope

Use fictional names and locations only. Enable Supabase row-level security: the demonstration permits public inserts and reads, but prohibits updates and deletes. Never expose service-role keys or commit secrets. Status editing conflicts with these access rules; resolve that requirement before implementing it. Authentication and notifications remain undecided.
