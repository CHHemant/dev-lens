#!/usr/bin/env node
import { program } from 'commander';
import { runAnalysis } from '../src/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

program
  .name('devlens')
  .description('🔍 Zero-config project health analyzer')
  .version(pkg.version, '-v, --version', 'output current version')
  .option('-p, --path <path>', 'project path to analyze', process.cwd())
  .option('--json', 'output raw JSON instead of terminal UI')
  .option('--no-git', 'skip git history analysis')
  .option('--no-deps', 'skip dependency analysis')
  .option('--no-todos', 'skip TODO/FIXME scanning')
  .option('--depth <number>', 'max directory depth for file scan', '10')
  .action(async (options) => {
    await runAnalysis({
      projectPath: options.path,
      json: options.json || false,
      analyzeGit: options.git !== false,
      analyzeDeps: options.deps !== false,
      analyzeTodos: options.todos !== false,
      depth: parseInt(options.depth, 10),
    });
  });

program.parse();
