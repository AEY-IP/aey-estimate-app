import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiDir = path.join(__dirname, '../src/app/api');

function addDynamicExport(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Проверяем, есть ли уже dynamic export
  if (content.includes('export const dynamic')) {
    console.log(`⏭️  Skipping ${filePath} - already has dynamic export`);
    return;
  }
  
  // Находим первый import
  const lines = content.split('\n');
  let insertIndex = 0;
  let foundFirstImport = false;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ')) {
      foundFirstImport = true;
    } else if (foundFirstImport && !lines[i].startsWith('import ') && lines[i].trim() !== '') {
      insertIndex = i;
      break;
    }
  }
  
  // Вставляем dynamic export после последнего import
  lines.splice(insertIndex, 0, '', "export const dynamic = 'force-dynamic'");
  
  const newContent = lines.join('\n');
  fs.writeFileSync(filePath, newContent, 'utf-8');
  console.log(`✅ Updated ${filePath}`);
}

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file === 'route.ts' || file === 'route.js') {
      addDynamicExport(fullPath);
    }
  }
}

console.log('🔧 Adding dynamic exports to API routes...\n');
processDirectory(apiDir);
console.log('\n✨ Done!');
