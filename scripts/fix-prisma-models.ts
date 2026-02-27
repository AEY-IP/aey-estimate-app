#!/usr/bin/env ts-node
import * as fs from 'fs'
import * as path from 'path'

const replacements = [
  { from: /prisma\.client\./g, to: 'prisma.clients.' },
  { from: /prisma\.estimate\./g, to: 'prisma.estimates.' },
  { from: /prisma\.workItem\./g, to: 'prisma.work_items.' },
  { from: /prisma\.leadRequest\./g, to: 'prisma.lead_requests.' },
  { from: /prisma\.roomParameter\./g, to: 'prisma.room_parameters.' },
  { from: /prisma\.coefficient\./g, to: 'prisma.coefficients.' },
  { from: /prisma\.workCategory\./g, to: 'prisma.work_categories.' },
]

function replaceInFile(filePath: string): boolean {
  const content = fs.readFileSync(filePath, 'utf-8')
  let newContent = content
  let changed = false

  for (const { from, to } of replacements) {
    if (from.test(newContent)) {
      newContent = newContent.replace(from, to)
      changed = true
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, newContent, 'utf-8')
    console.log(`✅ Обновлен: ${filePath}`)
  }

  return changed
}

function walkDir(dir: string): void {
  const files = fs.readdirSync(dir)

  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)

    if (stat.isDirectory()) {
      walkDir(filePath)
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceInFile(filePath)
    }
  }
}

const apiDir = path.join(process.cwd(), 'src', 'app', 'api')
console.log(`🔄 Исправляем модели Prisma в ${apiDir}...`)
walkDir(apiDir)
console.log('✅ Готово!')
