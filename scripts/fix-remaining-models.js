const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /prisma\.receiptBlock\./g, to: 'prisma.receipt_blocks.' },
  { from: /prisma\.clientUser\./g, to: 'prisma.client_users.' },
  { from: /prisma\.photoBlock\./g, to: 'prisma.photo_blocks.' },
  { from: /prisma\.projectNews\./g, to: 'prisma.project_news.' },
  { from: /prisma\.document\./g, to: 'prisma.documents.' },
  { from: /\(prisma\.estimate as any\)/g, to: 'prisma.estimates' },
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
console.log('🔄 Исправляем оставшиеся модели Prisma...');
walkDir(apiDir);
console.log('✅ Готово!');
