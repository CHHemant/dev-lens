import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function runNpmOutdated(projectPath) {
  try {
    const output = execSync('npm outdated --json', {
      cwd: projectPath,
      timeout: 20000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).toString();
    return JSON.parse(output || '{}');
  } catch (e) {
    // npm outdated exits with code 1 when there are outdated packages — parse anyway
    if (e.stdout) {
      try {
        return JSON.parse(e.stdout.toString());
      } catch {
        return {};
      }
    }
    return {};
  }
}

function detectPackageManager(projectPath) {
  if (existsSync(join(projectPath, 'pnpm-lock.yaml'))) return 'pnpm';
  if (existsSync(join(projectPath, 'yarn.lock'))) return 'yarn';
  if (existsSync(join(projectPath, 'package-lock.json'))) return 'npm';
  if (existsSync(join(projectPath, 'bun.lockb'))) return 'bun';
  return 'unknown';
}

export async function analyzeDeps(projectPath) {
  const packageJsonPath = join(projectPath, 'package.json');
  const requirementsPath = join(projectPath, 'requirements.txt');
  const cargoPath = join(projectPath, 'Cargo.toml');
  const goModPath = join(projectPath, 'go.mod');
  const gemfilePath = join(projectPath, 'Gemfile');

  const result = {
    ecosystem: null,
    packageManager: null,
    dependencies: [],
    devDependencies: [],
    totalDeps: 0,
    outdated: [],
    outdatedCount: 0,
  };

  // ── Node.js ───────────────────────────────────────────────────
  if (existsSync(packageJsonPath)) {
    const pkg = safeReadJson(packageJsonPath);
    if (!pkg) return result;

    result.ecosystem = 'Node.js';
    result.packageManager = detectPackageManager(projectPath);

    const deps = Object.entries(pkg.dependencies || {}).map(([name, version]) => ({
      name,
      version: version.replace(/[^0-9.]/g, ''),
      raw: version,
    }));
    const devDeps = Object.entries(pkg.devDependencies || {}).map(([name, version]) => ({
      name,
      version: version.replace(/[^0-9.]/g, ''),
      raw: version,
    }));

    result.dependencies = deps;
    result.devDependencies = devDeps;
    result.totalDeps = deps.length + devDeps.length;

    // Try npm outdated (non-blocking)
    if (existsSync(join(projectPath, 'node_modules'))) {
      const outdated = runNpmOutdated(projectPath);
      result.outdated = Object.entries(outdated).map(([name, info]) => ({
        name,
        current: info.current,
        wanted: info.wanted,
        latest: info.latest,
      }));
      result.outdatedCount = result.outdated.length;
    }

    return result;
  }

  // ── Python ───────────────────────────────────────────────────
  if (existsSync(requirementsPath)) {
    result.ecosystem = 'Python';
    const content = readFileSync(requirementsPath, 'utf8');
    const deps = content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [name, version] = line.split(/[==<>!~]+/);
        return { name: name.trim(), version: version?.trim() || '*', raw: line };
      });
    result.dependencies = deps;
    result.totalDeps = deps.length;
    result.packageManager = 'pip';
    return result;
  }

  // ── Rust ─────────────────────────────────────────────────────
  if (existsSync(cargoPath)) {
    result.ecosystem = 'Rust';
    result.packageManager = 'cargo';
    const content = readFileSync(cargoPath, 'utf8');
    const depSection = content.match(/\[dependencies\]([\s\S]*?)(\[|$)/);
    if (depSection) {
      const deps = depSection[1]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('#'))
        .map((l) => {
          const [name, version] = l.split('=').map((s) => s.trim().replace(/"/g, ''));
          return { name, version: version || '*', raw: l };
        });
      result.dependencies = deps.filter((d) => d.name);
      result.totalDeps = result.dependencies.length;
    }
    return result;
  }

  // ── Go ───────────────────────────────────────────────────────
  if (existsSync(goModPath)) {
    result.ecosystem = 'Go';
    result.packageManager = 'go mod';
    const content = readFileSync(goModPath, 'utf8');
    const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
    if (requireBlock) {
      const deps = requireBlock[1]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('//'))
        .map((l) => {
          const parts = l.split(/\s+/);
          return { name: parts[0], version: parts[1] || '*', raw: l };
        });
      result.dependencies = deps.filter((d) => d.name);
      result.totalDeps = result.dependencies.length;
    }
    return result;
  }

  return result;
}
