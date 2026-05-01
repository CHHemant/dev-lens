import { analyzeGit } from './analyzers/git.js';
import { analyzeCode } from './analyzers/code.js';
import { analyzeDeps } from './analyzers/deps.js';
import { analyzeTodos } from './analyzers/todos.js';
import { renderTerminal } from './reporters/terminal.js';
import ora from 'ora';
import { resolve } from 'path';
import { existsSync } from 'fs';

export async function runAnalysis(options) {
  const {
    projectPath: rawPath,
    json,
    analyzeGit: doGit,
    analyzeDeps: doDeps,
    analyzeTodos: doTodos,
    depth,
  } = options;

  const projectPath = resolve(rawPath);

  if (!existsSync(projectPath)) {
    console.error(`\n  ❌ Path not found: ${projectPath}\n`);
    process.exit(1);
  }

  const spinner = ora({ text: 'Initializing analysis...', color: 'cyan' }).start();

  const results = {
    path: projectPath,
    name: projectPath.split('/').pop(),
    timestamp: new Date().toISOString(),
    git: null,
    code: null,
    deps: null,
    todos: null,
    errors: [],
  };

  // ── Code Analysis ──────────────────────────────────────────────
  try {
    spinner.text = 'Scanning source files...';
    results.code = await analyzeCode(projectPath, depth);
  } catch (err) {
    results.errors.push({ phase: 'code', message: err.message });
  }

  // ── Git Analysis ───────────────────────────────────────────────
  if (doGit) {
    try {
      spinner.text = 'Reading git history...';
      results.git = await analyzeGit(projectPath);
    } catch (err) {
      results.errors.push({ phase: 'git', message: err.message });
    }
  }

  // ── Dependency Analysis ────────────────────────────────────────
  if (doDeps) {
    try {
      spinner.text = 'Auditing dependencies...';
      results.deps = await analyzeDeps(projectPath);
    } catch (err) {
      results.errors.push({ phase: 'deps', message: err.message });
    }
  }

  // ── TODO Analysis ──────────────────────────────────────────────
  if (doTodos) {
    try {
      spinner.text = 'Hunting TODOs & FIXMEs...';
      results.todos = await analyzeTodos(projectPath);
    } catch (err) {
      results.errors.push({ phase: 'todos', message: err.message });
    }
  }

  spinner.succeed('Analysis complete!');
  console.log('');

  if (json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    renderTerminal(results);
  }
}
