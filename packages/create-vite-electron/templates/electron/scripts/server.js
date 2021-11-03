#!/usr/bin/node

const { createServer } = require('vite')

/** @type 'production' | 'development'' */
const mode = (process.env.MODE = process.env.MODE || 'development')

/** @type {import('vite').LogLevel} */
const LOG_LEVEL = 'info'

/** @type {import('vite').InlineConfig} */
const sharedConfig = {
  mode,
  build: {
    watch: {}
  },
  logLevel: LOG_LEVEL
}

;(async () => {
  try {
    const viteDevServer = await createServer({
      ...sharedConfig,
      configFile: 'packages/renderer/vite.config.ts'
    })
    await viteDevServer.listen(process.env.PORT || 3000, true)
    viteDevServer.printUrls()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
