/**
 * @jest-environment node
 */

import { analyzeCode } from '../src/analyzers/code.js';
import { analyzeTodos } from '../src/analyzers/todos.js';
import { analyzeDeps } from '../src/analyzers/deps.js';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

describe('analyzeCode', () => {
  test('returns code stats for devlens itself', async () => {
    const result = await analyzeCode(ROOT);
    expect(result).toBeDefined();
    expect(result.totalFiles).toBeGreaterThan(0);
    expect(result.totalLines).toBeGreaterThan(0);
    expect(result.languages.length).toBeGreaterThan(0);
    expect(result.primaryLanguage).toBe('JavaScript');
  });

  test('languages include JavaScript', async () => {
    const result = await analyzeCode(ROOT);
    const jsLang = result.languages.find((l) => l.name === 'JavaScript');
    expect(jsLang).toBeDefined();
    expect(jsLang.files).toBeGreaterThan(0);
  });
});

describe('analyzeTodos', () => {
  test('returns todo structure', async () => {
    const result = await analyzeTodos(ROOT);
    expect(result).toBeDefined();
    expect(typeof result.total).toBe('number');
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.typeCounts).toBeDefined();
  });
});

describe('analyzeDeps', () => {
  test('detects Node.js ecosystem', async () => {
    const result = await analyzeDeps(ROOT);
    expect(result).toBeDefined();
    expect(result.ecosystem).toBe('Node.js');
    expect(result.totalDeps).toBeGreaterThan(0);
  });

  test('lists production dependencies', async () => {
    const result = await analyzeDeps(ROOT);
    expect(result.dependencies.length).toBeGreaterThan(0);
    const chalk = result.dependencies.find((d) => d.name === 'chalk');
    expect(chalk).toBeDefined();
  });
});
