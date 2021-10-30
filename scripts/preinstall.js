#!/usr/bin/env node
// https://github.com/vitejs/vite/blob/3e1cce01d01493d33e50966d0d0fd39a86d229f9/scripts/preinstall.js

if (!/pnpm/.test(process.env.npm_execpath || '')) {
  console.warn(
    `\u001b[33mThis repository requires using pnpm as the package manager ` +
      ` for scripts to work properly.\u001b[39m\n`
  )
  process.exit(1)
}
