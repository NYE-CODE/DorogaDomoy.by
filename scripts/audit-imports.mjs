import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const skipDirs = new Set(['node_modules', 'dist', '.git', 'backend', 'scripts']);
const intrinsic = new Set(['Fragment', 'Suspense', 'StrictMode', 'Profiler']);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function isGenericType(name) {
  return (
    name.startsWith('HTML') ||
    name.startsWith('SVG') ||
    name.endsWith('Element') ||
    name.endsWith('Props') ||
    name.endsWith('Type') ||
    name.endsWith('State') ||
    name.endsWith('Context') ||
    name === 'Icon' ||
    name === 'LucideComponent' ||
    name === 'ReactNode' ||
    name === 'JSX'
  );
}

function auditTsx(file) {
  if (!file.endsWith('.tsx')) return null;
  const src = fs.readFileSync(file, 'utf8');
  const scope = new Set(['React']);

  for (const m of src.matchAll(/import\s+(?:type\s+)?(?:\{([^}]+)\}|([A-Za-z_$][\w$]*)(?:\s*,\s*\{([^}]+)\})?)\s+from/g)) {
    if (m[2]) scope.add(m[2]);
    for (const part of [m[1], m[3]].filter(Boolean)) {
      for (const item of part.split(',')) {
        const name = item.trim().split(/\s+as\s+/).pop().trim();
        if (name) scope.add(name);
      }
    }
  }

  for (const m of src.matchAll(/(?:export\s+)?(?:default\s+)?(?:function|class)\s+([A-Z][\w$]*)/g)) {
    scope.add(m[1]);
  }
  for (const m of src.matchAll(/const\s+([A-Z][\w$]*)\s*=/g)) {
    scope.add(m[1]);
  }

  const stripped = src
    .replace(/useRef<[^>]+>/g, '')
    .replace(/useState<[^>]+>/g, '')
    .replace(/<[A-Z][\w$]*(?:\.[A-Z][\w$]*)?>/g, '')
    .replace(/:\s*[A-Z][\w$<>.,\s|&[\]]+/g, '');

  const issues = [];
  for (const m of stripped.matchAll(/<([A-Z][\w$]*)(?:[\s/>])/g)) {
    const name = m[1];
    if (isGenericType(name) || intrinsic.has(name)) continue;
    if (!scope.has(name)) issues.push(name);
  }

  const uniq = [...new Set(issues)];
  return uniq.length ? { file: path.relative(ROOT, file), missing: uniq } : null;
}

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.') && !spec.startsWith('@/')) return true;
  let base;
  if (spec.startsWith('@/')) base = path.join(ROOT, 'src', spec.slice(2));
  else base = path.resolve(path.dirname(fromFile), spec);
  const candidates = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx'];
  return candidates.some((s) => fs.existsSync(base + s));
}

function auditImports(file) {
  const src = fs.readFileSync(file, 'utf8');
  const bad = [];
  const re = /from\s+['"]([^'"]+)['"]/g;
  for (const m of src.matchAll(re)) {
    const spec = m[1];
    if (!spec.startsWith('.') && !spec.startsWith('@/')) continue;
    if (!resolveImport(file, spec)) bad.push(spec);
  }
  return bad.length ? { file: path.relative(ROOT, file), bad: [...new Set(bad)] } : null;
}

const files = walk(ROOT);
const jsxIssues = files.map(auditTsx).filter(Boolean);
const importIssues = files.map(auditImports).filter(Boolean);

console.log('=== JSX missing imports ===');
if (!jsxIssues.length) console.log('none');
else jsxIssues.forEach((r) => console.log(`${r.file}: ${r.missing.join(', ')}`));

console.log('=== Broken relative/@ imports ===');
if (!importIssues.length) console.log('none');
else importIssues.forEach((r) => console.log(`${r.file}: ${r.bad.join(', ')}`));

process.exit(jsxIssues.length || importIssues.length ? 1 : 0);
