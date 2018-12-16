const path = require('path')
const fs = require('fs')
const spawn = require('child_process').spawn

const lintStyles = ['standard', 'airbnb']

/**
 * Sorts dependencies in package.json alphabetically.
 * They are unsorted because they were grouped for the handlebars helpers
 * @param {object} data Data from questionnaire
 */
exports.sortDependencies = function sortDependencies(data) {
  const packageJsonFile = path.join(
    data.inPlace ? '' : data.destDirName,
    'package.json'
  )
  const packageJson = JSON.parse(fs.readFileSync(packageJsonFile))
  packageJson.devDependencies = sortObject(packageJson.devDependencies)
  packageJson.dependencies = sortObject(packageJson.dependencies)
  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJson, null, 2) + '\n')
}

/**
 * Runs `npm install` in the project directory
 * @param {string} cwd Path of the created project directory
 * @param {object} data Data from questionnaire
 */
exports.installDependencies = function installDependencies(
  cwd,
  executable = 'npm',
  color
) {
  console.log(`\n\n# ${color('正在安装项目依赖关系，请稍后...')}`)
  console.log('# ==========================================\n')
  return runCommand(executable, ['install'], {
    cwd,
  })
}

/**
 * Runs `npm run lint -- --fix` in the project directory
 * @param {string} cwd Path of the created project directory
 * @param {object} data Data from questionnaire
 */
exports.runLintFix = function runLintFix(cwd, data, color) {
  if (data.lint && lintStyles.indexOf(data.lintConfig) !== -1) {
    console.log(
      `\n\n${color(
        'Running eslint --fix to comply with chosen preset rules...'
      )}`
    )
    console.log('# ========================\n')
    const args =
      data.autoInstall === 'npm'
        ? ['run', 'lint', '--', '--fix']
        : ['run', 'lint', '--fix']
    return runCommand(data.autoInstall, args, {
      cwd,
    })
  }
  return Promise.resolve()
}

/**
 * 启动引导配置程序前的提示信息.
 */
exports.tipMessage = function tipMessage() {
  const message = `
# ====================================================
# 1.欢迎使用 awesome-vue-webpack-boilerplate 脚手架
# 2.本配置程序基于 vuejs-templates/webpack 深度定制
# ====================================================
`
  console.info(message)
}

/**
 * Prints the final message with instructions of necessary next steps.
 * @param {Object} data Data from questionnaire.
 */
exports.printMessage = function printMessage(data, { green, yellow }) {
  const message = `
# ${green('恭喜你，项目初始化完成!')}
# ========================

  请运行以下命令开始项目:

  ${yellow(
    `${data.inPlace ? '' : `cd ${data.destDirName}\n  `}${installMsg(
      data
    )}${lintMsg(data)}npm run dev`
  )}
  
参照文档地址: https://github.com/shenliyang/awesome-vue-webpack-boilerplate
`
  console.log(message)
}

/**
 * If the user will have to run lint --fix themselves, it returns a string
 * containing the instruction for this step.
 * @param {Object} data Data from questionnaire.
 */
function lintMsg(data) {
  return !data.autoInstall &&
    data.lint &&
    lintStyles.indexOf(data.lintConfig) !== -1
    ? 'npm run lint -- --fix (or for yarn: yarn run lint --fix)\n  '
    : ''
}

/**
 * If the user will have to run `npm install` or `yarn` themselves, it returns a string
 * containing the instruction for this step.
 * @param {Object} data Data from the questionnaire
 */
function installMsg(data) {
  return !data.autoInstall ? 'npm install (or if using yarn: yarn)\n  ' : ''
}

/**
 * Spawns a child process and runs the specified command
 * By default, runs in the CWD and inherits stdio
 * Options are the same as node's child_process.spawn
 * @param {string} cmd
 * @param {array<string>} args
 * @param {object} options
 */
function runCommand(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const spwan = spawn(
      cmd,
      args,
      Object.assign(
        {
          cwd: process.cwd(),
          stdio: 'inherit',
          shell: true,
        },
        options
      )
    )

    spwan.on('exit', () => {
      resolve()
    })
  })
}

function sortObject(object) {
  // Based on https://github.com/yarnpkg/yarn/blob/v1.3.2/src/config.js#L79-L85
  const sortedObject = {}
  Object.keys(object)
    .sort()
    .forEach(item => {
      sortedObject[item] = object[item]
    })
  return sortedObject
}
