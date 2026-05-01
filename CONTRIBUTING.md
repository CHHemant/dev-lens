# Contributing to devlens

Thank you for wanting to contribute! 🎉

## Setup

```bash
git clone https://github.com/CHHemant/dev-lens.git
cd dev-lens
npm install
```

## Development

```bash
# Run on current directory
node bin/devlens.js

# Run tests
npm test

# Run on a specific project
node bin/devlens.js --path /path/to/other/project
```

## Good First Issues

If you are new to the project, start with issues labeled
[good first issue](https://github.com/CHHemant/dev-lens/labels/good%20first%20issue).

## Communication

- Open an issue for bugs, feature ideas, or docs improvements
- Provide minimal reproduction steps and sample output when possible
- We aim to respond within 24–48 hours

## Maintainer Launch Plan (2 Weeks)

### Goals

- ⭐ 50+ stars from relevant dev communities
- 🧪 10+ users run dev-lens and share feedback
- 🧭 5+ actionable issues opened (bugs, feature requests, or docs)

### Outreach schedule

| Day | Focus | Example post |
|---|---|---|
| 1 | Launch announcement | “Zero-config project health in one command.” |
| 2 | Demo clip | 20–30s recording with a real repo |
| 3 | Lesson learned | What dev-lens surfaced in your own repo |
| 4 | Feature highlight | Git + TODO scan + health score |
| 5 | Use case | “Before a release: run dev-lens” |
| 6 | Community share | Ask for feedback, not stars |
| 7 | Recap | Share improvements + next goals |
| 8 | Progress update | Metrics + new issues fixed |
| 9 | Integration tip | JSON output for CI |
| 10 | Testimonial | Quote or screenshot from a user |
| 11 | Roadmap poll | Ask which feature to build next |
| 12 | Issue spotlight | “Good first issue” share |
| 13 | Behind the scenes | How scoring works |
| 14 | Wrap-up | Results + next milestone |

### Target communities

- r/opensource, r/commandline, r/webdev
- Indie Hackers, dev.to, Hashnode
- Discord servers/Slack groups for Node.js, OSS, and indie builders

### Engagement loop

- Respond within 24 hours to comments and issues
- Ship small fixes fast and share the update publicly
- Highlight contributors and credit feedback

## Project Structure

```
dev-lens/
├── bin/devlens.js          CLI entry point
├── src/
│   ├── index.js            Orchestrates all analyzers
│   ├── analyzers/
│   │   ├── git.js          Git history & status
│   │   ├── code.js         File scanning & language detection
│   │   ├── deps.js         Dependency parsing per ecosystem
│   │   └── todos.js        TODO/FIXME scanning
│   └── reporters/
│       └── terminal.js     Renders the terminal UI
└── tests/
    └── index.test.js       Jest tests
```

## Adding a New Ecosystem

1. Edit `src/analyzers/deps.js`
2. Add a new `if (existsSync(...))` block for the lockfile/manifest
3. Populate `result.ecosystem`, `result.packageManager`, `result.dependencies`, `result.totalDeps`
4. Add a row to the Ecosystem Support table in `README.md`

## Adding a New Language

Edit the `LANGUAGE_MAP` in `src/analyzers/code.js` and add your extension:

```js
'.ext': 'Language Name',
```

## Pull Request Guidelines

- Keep PRs focused (one feature or fix per PR)
- Add/update tests for new behavior
- Update README if adding user-facing features
- Run `npm test` before submitting

## Reporting Bugs

Open an issue with:
- OS and Node.js version
- The command you ran
- The error output
- Project type (Node/Python/etc.)
