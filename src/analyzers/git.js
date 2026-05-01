import simpleGit from 'simple-git';

const IGNORE_AUTHORS = new Set(['GitHub', 'github-actions[bot]', 'dependabot[bot]']);

export async function analyzeGit(projectPath) {
  const git = simpleGit(projectPath);

  // Check if it's actually a git repo
  const isRepo = await git.checkIsRepo();
  if (!isRepo) return null;

  const [log, status, branches, remotes] = await Promise.all([
    git.log(['--oneline', '--no-merges', '--max-count=500']).catch(() => ({ all: [] })),
    git.status().catch(() => null),
    git.branchLocal().catch(() => ({ all: [], current: 'unknown' })),
    git.getRemotes(true).catch(() => []),
  ]);

  // Contributor map
  const authorMap = new Map();
  for (const commit of log.all) {
    const author = commit.author_name || 'Unknown';
    if (!IGNORE_AUTHORS.has(author)) {
      authorMap.set(author, (authorMap.get(author) || 0) + 1);
    }
  }

  const contributors = [...authorMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, commits]) => ({ name, commits }));

  // Commit frequency — last 30 days
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const recentCommits = log.all.filter((c) => {
    const d = new Date(c.date).getTime();
    return d >= thirtyDaysAgo;
  }).length;

  // Latest commit
  const latest = log.all[0];

  // Remote URL
  const origin = remotes.find((r) => r.name === 'origin');
  const remoteUrl = origin?.refs?.fetch || null;

  return {
    totalCommits: log.all.length,
    recentCommits,
    contributors,
    currentBranch: branches.current,
    branchCount: branches.all.length,
    remoteUrl,
    lastCommit: latest
      ? {
          hash: latest.hash?.slice(0, 7),
          message: latest.message,
          date: latest.date,
          author: latest.author_name,
        }
      : null,
    workingDirClean: status ? status.files.length === 0 : null,
    stagedFiles: status ? status.staged.length : 0,
    modifiedFiles: status ? status.modified.length : 0,
  };
}
