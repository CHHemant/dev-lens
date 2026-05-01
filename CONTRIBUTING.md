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
