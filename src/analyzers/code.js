import { glob } from 'glob';
import { readFileSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const LANGUAGE_MAP = {
  '.js': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.jsx': 'JavaScript',
  '.py': 'Python',
  '.rb': 'Ruby',
  '.go': 'Go',
  '.rs': 'Rust',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.swift': 'Swift',
  '.c': 'C',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.h': 'C/C++ Header',
  '.cs': 'C#',
  '.php': 'PHP',
  '.html': 'HTML',
  '.htm': 'HTML',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'SASS',
  '.less': 'Less',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.json': 'JSON',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.toml': 'TOML',
  '.md': 'Markdown',
  '.mdx': 'MDX',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.sql': 'SQL',
  '.graphql': 'GraphQL',
  '.gql': 'GraphQL',
  '.tf': 'Terraform',
  '.dart': 'Dart',
  '.r': 'R',
  '.lua': 'Lua',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
  '.erl': 'Erlang',
  '.clj': 'Clojure',
  '.scala': 'Scala',
  '.hs': 'Haskell',
  '.elm': 'Elm',
};

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/__pycache__/**',
  '**/*.pyc',
  '**/vendor/**',
  '**/.cache/**',
  '**/coverage/**',
  '**/.nyc_output/**',
  '**/target/**',
  '**/out/**',
  '**/*.min.js',
  '**/*.min.css',
  '**/*.bundle.js',
  '**/*.lock',
  '**/package-lock.json',
  '**/yarn.lock',
  '**/pnpm-lock.yaml',
];

export async function analyzeCode(projectPath, maxDepth = 10) {
  const files = await glob('**/*', {
    cwd: projectPath,
    nodir: true,
    ignore: IGNORE_PATTERNS,
    maxDepth,
    absolute: true,
  });

  const langStats = new Map(); // lang → { files, lines, bytes }
  const fileDetails = [];
  let totalLines = 0;
  let totalBytes = 0;
  let binaryFiles = 0;

  for (const filePath of files) {
    const ext = extname(filePath).toLowerCase();
    const lang = LANGUAGE_MAP[ext] || 'Other';

    let lines = 0;
    let bytes = 0;
    let isBinary = false;

    try {
      const stat = statSync(filePath);
      bytes = stat.size;

      // Skip very large files
      if (bytes > 5 * 1024 * 1024) continue;

      const content = readFileSync(filePath, 'utf8');
      lines = content.split('\n').length;

      // Heuristic binary check
      if (content.includes('\0')) {
        isBinary = true;
        binaryFiles++;
      }
    } catch {
      continue;
    }

    if (isBinary) continue;

    totalLines += lines;
    totalBytes += bytes;

    const existing = langStats.get(lang) || { files: 0, lines: 0, bytes: 0 };
    langStats.set(lang, {
      files: existing.files + 1,
      lines: existing.lines + lines,
      bytes: existing.bytes + bytes,
    });

    fileDetails.push({
      path: relative(projectPath, filePath),
      lines,
      bytes,
      lang,
    });
  }

  // Sort languages by lines of code
  const languages = [...langStats.entries()]
    .sort((a, b) => b[1].lines - a[1].lines)
    .map(([name, stats]) => ({
      name,
      files: stats.files,
      lines: stats.lines,
      bytes: stats.bytes,
      percent: totalLines > 0 ? Math.round((stats.lines / totalLines) * 100) : 0,
    }));

  // Top 10 largest files
  const largestFiles = fileDetails
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10)
    .map((f) => ({ path: f.path, lines: f.lines, lang: f.lang }));

  return {
    totalFiles: fileDetails.length,
    totalLines,
    totalBytes,
    binaryFiles,
    languages,
    largestFiles,
    primaryLanguage: languages[0]?.name || 'Unknown',
  };
}
