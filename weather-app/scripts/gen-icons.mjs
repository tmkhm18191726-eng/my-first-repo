import { chromium } from 'playwright'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const htmlPath = path.join(__dirname, 'icon.html')
const outDir = path.join(__dirname, '..', 'public', 'icons')

const sizes = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
]

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage()
await page.goto(`file://${htmlPath}`)

for (const { name, size } of sizes) {
  await page.setViewportSize({ width: size, height: size })
  await page.screenshot({ path: path.join(outDir, name) })
  console.log('wrote', name)
}

await browser.close()
