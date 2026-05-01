import chalk from 'chalk';
import boxen from 'boxen';

// ── Palette ────────────────────────────────────────────────────────────
const c = {
  primary: chalk.hex('#00D4FF'),
  accent: chalk.hex('#FF6B6B'),
  green: chalk.hex('#4ECDC4'),
  yellow: chalk.hex('#FFE66D'),
  purple: chalk.hex('#C084FC'),
  dim: chalk.gray,
  bold: chalk.bold,
  white: chalk.white,
};

const HEALTH_COLORS = {
  great: chalk.hex('#4ECDC4'),
  good: chalk.hex('#A8E6CF'),
  warn: chalk.hex('#FFE66D'),
  bad: chalk.hex('#FF6B6B'),
};

// ── Helpers ────────────────────────────────────────────────────────────
function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function fmtBytes(bytes) {
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

function fmtDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function bar(percent, width = 20) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return c.primary('█'.repeat(filled)) + c.dim('░'.repeat(empty));
}

function miniBar(value, max, width = 10) {
  const pct = max > 0 ? value / max : 0;
  const filled = Math.round(pct * width);
  const empty = width - filled;
  return c.green('▓'.repeat(filled)) + c.dim('░'.repeat(empty));
}

function healthScore(results) {
  let score = 100;
  const penalties = [];

  if (results.git) {
    if (results.git.recentCommits === 0) { score -= 15; penalties.push('no recent commits'); }
    if (!results.git.workingDirClean) { score -= 5; penalties.push('dirty working dir'); }
  }
  if (results.deps) {
    if (results.deps.outdatedCount > 10) { score -= 20; penalties.push('many outdated deps'); }
    else if (results.deps.outdatedCount > 5) { score -= 10; penalties.push('some outdated deps'); }
    else if (results.deps.outdatedCount > 0) { score -= 5; }
  }
  if (results.todos) {
    const bugs = results.todos.typeCounts['BUG'] || 0;
    const fixmes = results.todos.typeCounts['FIXME'] || 0;
    if (bugs > 10) { score -= 20; penalties.push('many BUGs'); }
    else if (bugs > 0) { score -= bugs * 2; }
    if (fixmes > 20) { score -= 15; penalties.push('many FIXMEs'); }
    else if (fixmes > 0) { score -= Math.min(fixmes, 10); }
  }

  score = Math.max(0, Math.min(100, score));
  return { score, penalties };
}

function scoreColor(score) {
  if (score >= 85) return HEALTH_COLORS.great;
  if (score >= 70) return HEALTH_COLORS.good;
  if (score >= 50) return HEALTH_COLORS.warn;
  return HEALTH_COLORS.bad;
}

function scoreGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

// ── Sections ───────────────────────────────────────────────────────────
function renderHeader(results) {
  const { score, penalties } = healthScore(results);
  const sc = scoreColor(score);
  const grade = scoreGrade(score);

  const title = c.primary.bold(`  🔍 devlens`) + c.dim(` v1.0.0`);
  const projectName = c.bold.white(results.name);
  const timestamp = c.dim(new Date(results.timestamp).toLocaleString());
  const health = sc.bold(`  ${score}/100`) + c.dim(` (${grade})`);
  const penaltyStr = penalties.length
    ? c.dim('  ⚠  ' + penalties.join(', '))
    : c.green('  ✓ All good');

  return boxen(
    `${title}\n\n  Project: ${projectName}\n  Path:    ${c.dim(results.path)}\n  Scanned: ${timestamp}\n\n  Health:  ${health}\n${penaltyStr}`,
    {
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      dimBorder: false,
    }
  );
}

function renderCode(code) {
  if (!code) return '';
  const lines = [];

  lines.push(c.primary.bold('  ◆ CODE OVERVIEW'));
  lines.push('');
  lines.push(`  Files        ${c.white.bold(fmt(code.totalFiles))}`);
  lines.push(`  Lines        ${c.white.bold(fmt(code.totalLines))}`);
  lines.push(`  Size         ${c.white.bold(fmtBytes(code.totalBytes))}`);
  lines.push(`  Primary      ${c.yellow.bold(code.primaryLanguage)}`);
  lines.push('');

  if (code.languages.length > 0) {
    lines.push(c.dim('  ── Language Breakdown ─────────────────────'));
    const topLangs = code.languages.slice(0, 8);
    const maxLines = topLangs[0]?.lines || 1;
    for (const lang of topLangs) {
      const name = lang.name.padEnd(16);
      const pct = String(lang.percent + '%').padStart(4);
      const b = miniBar(lang.lines, maxLines, 15);
      const files = c.dim(`${lang.files}f`);
      lines.push(`  ${c.dim(name)} ${pct}  ${b}  ${files}`);
    }
  }

  if (code.largestFiles.length > 0) {
    lines.push('');
    lines.push(c.dim('  ── Largest Files ──────────────────────────'));
    for (const f of code.largestFiles.slice(0, 5)) {
      const name = f.path.length > 42 ? '…' + f.path.slice(-41) : f.path;
      lines.push(`  ${c.dim(name.padEnd(43))} ${c.white(fmt(f.lines))} lines`);
    }
  }

  return lines.join('\n');
}

function renderGit(git) {
  if (!git) return '';
  const lines = [];

  lines.push(c.purple.bold('  ◆ GIT HEALTH'));
  lines.push('');

  const statusIcon = git.workingDirClean ? c.green('✓ clean') : c.yellow('⚠ dirty');
  lines.push(`  Branch       ${c.yellow.bold(git.currentBranch)}`);
  lines.push(`  Status       ${statusIcon}`);
  lines.push(`  Branches     ${c.white.bold(git.branchCount)}`);
  lines.push(`  Commits      ${c.white.bold(fmt(git.totalCommits))} total, ${c.white.bold(git.recentCommits)} last 30d`);

  if (git.lastCommit) {
    lines.push('');
    lines.push(c.dim('  ── Last Commit ─────────────────────────────'));
    lines.push(`  ${c.dim(git.lastCommit.hash)}  ${c.white(git.lastCommit.message.slice(0, 55))}`);
    lines.push(`  by ${c.yellow(git.lastCommit.author)} · ${c.dim(fmtDate(git.lastCommit.date))}`);
  }

  if (git.contributors.length > 0) {
    lines.push('');
    lines.push(c.dim('  ── Top Contributors ────────────────────────'));
    const maxCommits = git.contributors[0]?.commits || 1;
    for (const c_ of git.contributors.slice(0, 6)) {
      const name = c_.name.slice(0, 20).padEnd(21);
      const b = miniBar(c_.commits, maxCommits, 12);
      lines.push(`  ${c.dim(name)} ${b}  ${c.white(c_.commits)}`);
    }
  }

  return lines.join('\n');
}

function renderDeps(deps) {
  if (!deps || !deps.ecosystem) return '';
  const lines = [];

  lines.push(c.yellow.bold('  ◆ DEPENDENCIES'));
  lines.push('');
  lines.push(`  Ecosystem    ${c.white.bold(deps.ecosystem)}`);
  lines.push(`  Manager      ${c.white.bold(deps.packageManager || 'unknown')}`);
  lines.push(`  Total        ${c.white.bold(deps.totalDeps)}`);

  if (deps.dependencies.length > 0) {
    lines.push(`  Production   ${c.white(deps.dependencies.length)}`);
  }
  if (deps.devDependencies.length > 0) {
    lines.push(`  Dev          ${c.dim(deps.devDependencies.length)}`);
  }

  if (deps.outdatedCount > 0) {
    lines.push('');
    const outdatedColor = deps.outdatedCount > 10 ? c.accent : c.yellow;
    lines.push(c.dim('  ── Outdated Packages ───────────────────────'));
    lines.push(`  ${outdatedColor.bold(deps.outdatedCount + ' outdated')} packages found`);
    for (const pkg of deps.outdated.slice(0, 5)) {
      const name = pkg.name.slice(0, 22).padEnd(23);
      lines.push(`  ${c.dim(name)} ${c.dim(pkg.current)} → ${c.green(pkg.latest)}`);
    }
    if (deps.outdated.length > 5) {
      lines.push(`  ${c.dim(`  …and ${deps.outdated.length - 5} more`)}`);
    }
  } else if (deps.outdatedCount === 0 && deps.totalDeps > 0) {
    lines.push('');
    lines.push(`  ${c.green('✓')} All packages up to date`);
  }

  return lines.join('\n');
}

function renderTodos(todos) {
  if (!todos || todos.total === 0) return '';
  const lines = [];

  lines.push(c.accent.bold('  ◆ TODOS & TECHNICAL DEBT'));
  lines.push('');
  lines.push(`  Total Items  ${c.white.bold(todos.total)}`);

  const typeOrder = ['BUG', 'FIXME', 'HACK', 'XXX', 'TODO', 'OPTIMIZE', 'REFACTOR', 'NOTE'];
  const typeColors = {
    BUG: c.accent,
    FIXME: c.accent,
    HACK: c.yellow,
    XXX: c.yellow,
    TODO: c.primary,
    OPTIMIZE: c.purple,
    REFACTOR: c.purple,
    NOTE: c.dim,
  };

  lines.push('');
  lines.push(c.dim('  ── By Type ─────────────────────────────────'));
  for (const type of typeOrder) {
    const count = todos.typeCounts[type];
    if (!count) continue;
    const col = typeColors[type] || c.white;
    lines.push(`  ${col(type.padEnd(10))} ${c.white.bold(count)}`);
  }

  if (todos.topItems.length > 0) {
    const highPriority = todos.topItems.filter((i) => ['BUG', 'FIXME'].includes(i.type));
    if (highPriority.length > 0) {
      lines.push('');
      lines.push(c.dim('  ── High Priority ───────────────────────────'));
      for (const item of highPriority.slice(0, 5)) {
        const col = typeColors[item.type] || c.white;
        const loc = `${item.file}:${item.line}`.slice(0, 40);
        lines.push(`  ${col(item.type.padEnd(7))} ${c.dim(loc)}`);
        if (item.message) {
          lines.push(`         ${c.white(item.message.slice(0, 60))}`);
        }
      }
    }
  }

  return lines.join('\n');
}

function renderErrors(errors) {
  if (!errors || errors.length === 0) return '';
  const lines = [];
  lines.push(c.dim('  ── Warnings ─────────────────────────────────'));
  for (const e of errors) {
    lines.push(`  ${c.dim('⚠')} ${e.phase}: ${c.dim(e.message)}`);
  }
  return lines.join('\n');
}

// ── Main Render ────────────────────────────────────────────────────────
export function renderTerminal(results) {
  const sections = [
    renderHeader(results),
    '',
    renderCode(results.code),
    results.code && results.git ? '\n' + c.dim('  ' + '─'.repeat(50)) + '\n' : '',
    renderGit(results.git),
    results.git && results.deps ? '\n' + c.dim('  ' + '─'.repeat(50)) + '\n' : '',
    renderDeps(results.deps),
    results.deps && results.todos ? '\n' + c.dim('  ' + '─'.repeat(50)) + '\n' : '',
    renderTodos(results.todos),
    results.errors.length > 0 ? '\n' + renderErrors(results.errors) : '',
    '',
    c.dim('  Run with --json for machine-readable output. devlens --help for options.'),
    '',
  ];

  console.log(sections.filter(Boolean).join('\n'));
}
