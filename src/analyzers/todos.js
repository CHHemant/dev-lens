import { glob } from 'glob';
import { readFileSync } from 'fs';
import { relative } from 'path';

const TODO_PATTERN = /(?:\/\/|#|\/\*|<!--)\s*(TODO|FIXME|HACK|BUG|XXX|NOTE|OPTIMIZE|REFACTOR)(?:\(([^)]+)\))?:?\s*(.+?)(?:\*\/|-->|$)/gi;

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/__pycache__/**',
  '**/vendor/**',
  '**/*.lock',
  '**/package-lock.json',
  '**/yarn.lock',
];

const PRIORITY_RANK = {
  BUG: 0,
  FIXME: 1,
  HACK: 2,
  XXX: 3,
  TODO: 4,
  OPTIMIZE: 5,
  REFACTOR: 6,
  NOTE: 7,
};

export async function analyzeTodos(projectPath) {
  const files = await glob('**/*.{js,ts,jsx,tsx,py,rb,go,rs,java,kt,swift,c,cpp,cs,php,vue,svelte,sh,sql,html,css,scss}', {
    cwd: projectPath,
    nodir: true,
    ignore: IGNORE_PATTERNS,
    absolute: true,
    maxDepth: 10,
  });

  const items = [];
  const typeCounts = {};

  for (const filePath of files) {
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      const matches = [...line.matchAll(TODO_PATTERN)];
      for (const match of matches) {
        const type = match[1].toUpperCase();
        const assignee = match[2] || null;
        const message = match[3]?.trim() || '';

        typeCounts[type] = (typeCounts[type] || 0) + 1;

        items.push({
          type,
          assignee,
          message: message.slice(0, 120),
          file: relative(projectPath, filePath),
          line: idx + 1,
          priority: PRIORITY_RANK[type] ?? 99,
        });
      }
    });
  }

  // Sort by priority (BUG first, NOTE last)
  items.sort((a, b) => a.priority - b.priority);

  return {
    total: items.length,
    typeCounts,
    items: items.slice(0, 50), // top 50
    topItems: items.slice(0, 10),
  };
}
