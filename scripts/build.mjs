import fs from 'node:fs';
import path from 'node:path';

const srcDir = path.resolve('src');
const outDir = path.resolve('dist');

function rmrf(p){
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, { recursive: true, force: true });
}

function copyDir(src, dest){
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else if (entry.isSymbolicLink()) {
      const real = fs.readlinkSync(s);
      fs.symlinkSync(real, d);
    } else fs.copyFileSync(s, d);
  }
}

rmrf(outDir);
copyDir(srcDir, outDir);
console.log('Built static site: dist/ (copied from src/)');
