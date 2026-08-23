import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const sharedDirectory = join(process.cwd(), 'node_modules', 'rolldown', 'dist', 'shared')
const files = await readdir(sharedDirectory).catch(() => [])
const target = files.find(file => file.startsWith('create-bundler-option-') && file.endsWith('.mjs'))

if (target) {
  const path = join(sharedDirectory, target)
  const source = await readFile(path, 'utf8')
  const patched = source.replace(
    'styleText$1(["underline", "gray"], "info")',
    'styleText$1("underline", styleText$1("gray", "info"))'
  )

  if (patched !== source) {
    await writeFile(path, patched)
    console.log('Applied Rolldown styleText compatibility patch.')
  }
}
