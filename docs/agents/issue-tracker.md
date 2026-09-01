# Issue tracker: GitHub + Local Markdown

This repo uses **two** issue surfaces:

1. **GitHub Issues** — canonical, shareable tracker for work that should be visible on the remote.
2. **Local markdown** under `.scratch/` — fast scratchpad for specs, spikes, and agent-driven breakdowns before (or alongside) publishing to GitHub.

Prefer GitHub when the work is ready to be tracked publicly on the repo. Use local markdown for exploration, drafts, and wayfinding maps; promote to GitHub when the ticket is real.

## GitHub (canonical)

Remote: https://github.com/garykhfung/Q_Mario.git  
Repo: `garykhfung/Q_Mario`

Issues live in this repo's GitHub Issues. Use the `gh` CLI for all operations.

Infer the repo from `git remote -v` when inside the clone. If `gh` cannot infer it, pass `--repo garykhfung/Q_Mario`.

### Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --comments`, filtering comments by `jq` and also fetching labels.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: `gh issue close <number> --comment "..."`

### Pull requests as a triage surface

**PRs as a request surface: no.**

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents. GitHub shares one number space across issues and PRs.

### When a skill says "publish to the issue tracker"

Create a **GitHub issue** unless the user explicitly asked for a local draft only.

After creating the GitHub issue, optionally add a one-line pointer in the relevant `.scratch/<feature>/map.md` Decisions-so-far section: `GitHub: #<n>`.

## Local markdown (scratchpad)

Issues and specs live as markdown files in `.scratch/`.

### Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Status is recorded as a `Status:` line near the top of each issue file
- Comments append under a `## Comments` heading

### When a skill says "fetch the relevant ticket"

- If given a path (`.scratch/...`), read that file.
- If given `#<n>`, use `gh issue view <n> --comments`.

### Promoting local → GitHub

When a `.scratch/` ticket is ready for the canonical tracker:

1. `gh issue create` with the ticket title and body (link back to the scratch path in the body).
2. Set `Status: resolved` on the local file and add `GitHub: #<n>` at the top.

## Wayfinding operations

Used by `/wayfinder`.

**GitHub map**: a single issue labelled `wayfinder:map`, with child issues as sub-issues or linked in a task list. See GitHub issue-tracker conventions above.

**Local map**: `.scratch/<effort>/map.md` with children at `.scratch/<effort>/issues/NN-<slug>.md`. Blocking via `Blocked by: NN, NN`; frontier = first open, unblocked, unclaimed file by number.
