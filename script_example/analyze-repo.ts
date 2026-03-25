#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REPO_URL = process.argv[2];

if (!REPO_URL) {
  console.error('Usage: npx tsx analyze-repo.ts <github-repo-url>');
  process.exit(1);
}

const repoName = REPO_URL.split('/').pop()!.replace('.git', '');
const cloneDir = path.join('/tmp', `repo-analysis-${repoName}-${Date.now()}`);

function cleanup(): void {
  if (fs.existsSync(cloneDir)) {
    console.log('Cleaning up cloned repo...');
    fs.rmSync(cloneDir, { recursive: true, force: true });
  }
}

process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(1));
process.on('SIGTERM', () => process.exit(1));

function cloneRepo(): void {
  console.log(`Cloning ${REPO_URL}...`);
  execSync(`git clone --depth=1 "${REPO_URL}" "${cloneDir}"`, { stdio: 'inherit' });
}

function walkDir(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', '.venv'].includes(entry.name)) continue;
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function countByExtension(files: string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const file of files) {
    const ext = path.extname(file).toLowerCase() || '(no extension)';
    counts[ext] = (counts[ext] ?? 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .reduce<Record<string, number>>((acc, [k, v]) => { acc[k] = v; return acc; }, {});
}

function detectStack(files: string[]): string[] {
  const rootFiles = files
    .map(f => path.relative(cloneDir, f))
    .map(f => f.split(path.sep)[0]);

  const stack: string[] = [];

  const checks: Array<{ file: string; label: string }> = [
    { file: 'package.json',        label: 'Node.js / JavaScript' },
    { file: 'tsconfig.json',       label: 'TypeScript' },
    { file: 'go.mod',              label: 'Go' },
    { file: 'requirements.txt',    label: 'Python (pip)' },
    { file: 'pyproject.toml',      label: 'Python (pyproject)' },
    { file: 'Pipfile',             label: 'Python (Pipenv)' },
    { file: 'Cargo.toml',          label: 'Rust' },
    { file: 'pom.xml',             label: 'Java (Maven)' },
    { file: 'build.gradle',        label: 'Java/Kotlin (Gradle)' },
    { file: 'composer.json',       label: 'PHP (Composer)' },
    { file: 'Gemfile',             label: 'Ruby (Bundler)' },
    { file: 'mix.exs',             label: 'Elixir' },
    { file: 'pubspec.yaml',        label: 'Dart / Flutter' },
    { file: 'CMakeLists.txt',      label: 'C/C++ (CMake)' },
    { file: 'Makefile',            label: 'Make' },
    { file: 'Dockerfile',          label: 'Docker' },
    { file: 'docker-compose.yml',  label: 'Docker Compose' },
    { file: 'docker-compose.yaml', label: 'Docker Compose' },
    { file: '.github',             label: 'GitHub Actions' },
  ];

  for (const { file, label } of checks) {
    if (rootFiles.includes(file)) stack.push(label);
  }

  // Framework detection via package.json
  const pkgPath = path.join(cloneDir, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps: Record<string, string> = { ...pkg.dependencies, ...pkg.devDependencies };
      const frameworks: Array<[string, string]> = [
        ['react',        'React'],
        ['next',         'Next.js'],
        ['vue',          'Vue.js'],
        ['nuxt',         'Nuxt'],
        ['svelte',       'Svelte'],
        ['express',      'Express'],
        ['fastify',      'Fastify'],
        ['@nestjs/core', 'NestJS'],
        ['astro',        'Astro'],
        ['vite',         'Vite'],
        ['webpack',      'Webpack'],
        ['jest',         'Jest'],
        ['vitest',       'Vitest'],
        ['tailwindcss',  'Tailwind CSS'],
        ['prisma',       'Prisma'],
        ['drizzle-orm',  'Drizzle ORM'],
      ];
      for (const [dep, label] of frameworks) {
        if (deps[dep]) stack.push(label);
      }
    } catch {
      // ignore malformed package.json
    }
  }

  return [...new Set(stack)];
}

function generateReport(extCounts: Record<string, number>, stack: string[], totalFiles: number): string {
  const date = new Date().toISOString().split('T')[0];
  const extTable = Object.entries(extCounts)
    .map(([ext, count]) => `| \`${ext}\` | ${count} |`)
    .join('\n');

  const stackList = stack.length
    ? stack.map(s => `- ${s}`).join('\n')
    : '- Unable to detect (no known config files found)';

  return `# Repository Analysis Report

**Repository:** ${REPO_URL}
**Date:** ${date}
**Total files analyzed:** ${totalFiles}

---

## Tech Stack

${stackList}

---

## Files by Extension

| Extension | Count |
|-----------|-------|
${extTable}
`;
}

// Main
try {
  cloneRepo();

  const files = walkDir(cloneDir);
  const extCounts = countByExtension(files);
  const stack = detectStack(files);
  const report = generateReport(extCounts, stack, files.length);

  const reportPath = path.join(process.cwd(), 'REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf8');

  console.log(`\nReport written to ${reportPath}`);
  console.log(`Detected stack: ${stack.join(', ') || 'unknown'}`);
  console.log(`Total files: ${files.length}`);
} catch (err) {
  console.error('Error:', (err as Error).message);
  process.exit(1);
}
