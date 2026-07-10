import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.dirname, '..');
const skipDirs = new Set(['node_modules', 'dist', '.git', 'backend', 'scripts']);
const rootModules = new Set(['types', 'api', 'context', 'utils', 'styles']);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skipDirs.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(ent.name)) out.push(p);
  }
  return out;
}

function auditRelativeImports(file) {
  const rel = path.relative(ROOT, file).replace(/\\/g, '/');
  const parts = rel.split('/');
  if (parts.length < 2) return null;

  const dirDepth = parts.length - 1;
  const src = fs.readFileSync(file, 'utf8');
  const bad = [];

  for (const m of src.matchAll(/from\s+['"](\.\.[^'"]+)['"]/g)) {
    const spec = m[1];
    if (!spec.includes('/')) continue;
    const firstSegment = spec.replace(/^(\.\.\/)+/, '').split('/')[0];
    if (!rootModules.has(firstSegment)) continue;

    const upCount = (spec.match(/\.\.\//g) || []).length;
    if (upCount < dirDepth) {
      bad.push({ spec, needed: dirDepth, upCount });
    }
  }

  return bad.length ? { file: rel, bad } : null;
}

const results = walk(ROOT).map(auditRelativeImports).filter(Boolean);
if (!results.length) {
  console.log('OK: no shallow imports to root modules');
} else {
  for (const r of results) {
    console.log(`${r.file}`);
    for (const b of r.bad) console.log(`  ${b.spec} (has ${b.upCount} .., need ${b.needed})`);
  }
  process.exit(1);
}
