const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /prisma\.client\./g, to: 'prisma.clients.' },
  { from: /prisma\.estimate\./g, to: 'prisma.estimates.' },
  { from: /prisma\.workItem\./g, to: 'prisma.work_items.' },
  { from: /prisma\.leadRequest\./g, to: 'prisma.lead_requests.' },
];

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  let changed = false;

  for (const { from, to } of replacements) {
    if (from.test(newContent)) {
      newContent = newContent.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`✅ ${filePath}`);
  }
  return changed;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  }
}

const apiDir = path.join(process.cwd(), 'src', 'app', 'api');
console.log('🔄 Исправляем модели Prisma...');
walkDir(apiDir);
console.log('✅ Готово!');
