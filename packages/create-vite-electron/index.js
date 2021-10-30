const { red, green, yellow, blue, magenta, cyan } = require('kolorist')
const prompts = require('prompts')
const path = require('path')
const fs = require('fs')
const argv = require('minimist')(process.argv.slice(2), { string: ['_'] })
const cwd = process.cwd()
const FRAMEWORKS = [
  {
    name: 'vue',
    color: green,
    devDependencies: {
      '@vitejs/plugin-vue': '^1.9.4',
      'vue-tsc': '^0.28.9'
    },
    dependencies: {
      vue: '^3.2.20',
      'vue-router': '^4.0.12'
    }
  },
  {
    name: 'react',
    color: blue,
    devDependencies: {
      '@types/react': '^17.0.0',
      '@types/react-dom': '^17.0.0',
      '@vitejs/plugin-react': '^1.0.0'
    },
    dependencies: {
      react: '^17.0.0',
      'react-dom': '^17.0.0'
    }
  },
  {
    name: 'svelte',
    color: red,
    scripts: {
      check: 'svelte-check --tsconfig ./tsconfig.json'
    },
    devDependencies: {
      '@sveltejs/vite-plugin-svelte': '^1.0.0-next.11',
      '@tsconfig/svelte': '^2.0.1',
      'svelte-check': '^2.1.0',
      'svelte-preprocess': '^4.7.2'
    },
    dependencies: {
      svelte: '^3.37.0'
    }
  },
  {
    name: 'preact',
    color: cyan,
    devDependencies: {
      '@preact/preset-vite': '^2.0.0'
    },
    dependencies: {
      preact: '^10.5.13'
    }
  },
  // TODO:add more info
  {
    name: 'lit',
    color: yellow,
    devDependencies: {},
    dependencies: {
      lit: '^2.0.0'
    }
  },
  {
    name: 'vanilla',
    color: red
  }
]
const LANGS = [
  // {
  //     name: "Javascript",
  //     color: yellow,
  //     variants: FRAMEWORKS,
  // },
  {
    name: 'Typescript',
    color: blue,
    variants: FRAMEWORKS
  }
]

const renameFiles = {
  _gitignore: '.gitignore'
}
async function init() {
  let targetDir = argv._[0]
  let _framework = argv.framework || argv.f
  let _lang = argv.lang || argv.l
  const defaultProjectName = !targetDir && !'vite-electron-project' && argv._[0]
  let result = {}
  try {
    result = await prompts(
      [
        {
          type: targetDir ? null : 'text',
          name: 'projectName',
          message: 'Project name',
          initial: defaultProjectName,
          onState: (state) => {
            targetDir = state.value.trim() || defaultProjectName
          }
        },
        {
          type:
            _lang && LANGS.find(({ name }) => name === _lang) ? null : 'select',
          name: 'lang',
          message: typeof _lang === 'string' ? `Lang: ${_lang}` : 'Lang',
          initial: 0,
          choices: LANGS.map((l) => {
            const color = l.color
            return {
              title: color(l.name),
              value: l
            }
          })
        },
        {
          type:
            _framework && FRAMEWORKS.map((f) => f.name).includes(_framework)
              ? null
              : 'select',
          name: 'framework',
          message:
            typeof _framework === 'string' &&
            !FRAMEWORKS.map((it) => it.name).includes(_framework)
              ? `"${_framework}" is not a valid _framework. Please choose from blew: `
              : 'Select Framework',
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.name),
              value: framework
            }
          })
        }
      ],
      {
        onCancel: () => {
          throw new Error(red('✖') + ' Operation cancelled')
        }
      }
    )
  } catch (cancelled) {
    console.log(cancelled.message)
    return
  }
  const { framework, lang, projectName } = result
  const root = path.join(cwd, targetDir)
  let templateDir = ''
  if (lang.name === 'Typescript') {
    templateDir = path.join(__dirname, `../../templates/ts/${framework.name}`)
  } else {
    templateDir = path.join(__dirname, `../../templates/js/${framework.name}`)
  }

  // copy electron files
  const electronRootDir = path.join(__dirname, '../../templates/electron')
  const electronFiles = fs.readdirSync(electronRootDir)
  const writleElectronFile = (file, content) => {
    const tragetPath = renameFiles[file]
      ? path.join(root, renameFiles[file])
      : path.join(root, file)
    if (content) {
      fs.writeFileSync(tragetPath, content)
    } else {
      copy(path.join(electronRootDir, file), tragetPath)
    }
  }

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir)
  }
  for (const file of electronFiles.filter((f) => f !== 'package.json')) {
    writleElectronFile(file)
  }

  const rootPkg = require(path.join(electronRootDir, 'package.json'))
  rootPkg.name = projectName || targetDir
  // 框架间的依赖差异性
  rootPkg.dependencies = {
    ...rootPkg.dependencies,
    ...framework.dependencies
  }
  rootPkg.devDependencies = {
    ...rootPkg.devDependencies,
    ...framework.devDependencies
  }

  writleElectronFile('package.json', JSON.stringify(rootPkg, null, 2))

  // 复制模版文件
  const rendererDir = path.join(targetDir, 'packages/renderer')
  if (!fs.existsSync(rendererDir)) {
    fs.mkdirSync(rendererDir)
  }
  const rendererFiles = fs.readdirSync(templateDir)
  const writeRendererFiles = (file, content) => {
    const tragetPath = path.join(rendererDir, file)
    if (content) {
      fs.writeFileSync(tragetPath, content)
    } else {
      copy(path.join(templateDir, file), tragetPath)
    }
  }
  for (const file of rendererFiles) {
    writeRendererFiles(file)
  }

  //  输出 环境 信息
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : 'npm'

  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(`  cd ${path.relative(cwd, root)}`)
  }
  switch (pkgManager) {
    case 'yarn':
      console.log('  yarn')
      console.log('  yarn dev')
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run dev`)
      break
  }
  console.log()
}

function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

/**
 * @param {string | undefined} userAgent process.env.npm_config_user_agent
 * @returns object | undefined
 */
function pkgFromUserAgent(userAgent) {
  if (!userAgent) return undefined
  const pkgSpec = userAgent.split(' ')[0]
  const pkgSpecArr = pkgSpec.split('/')
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  }
}

init().catch((e) => {
  console.error(e)
})
