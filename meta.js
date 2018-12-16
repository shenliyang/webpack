const path = require('path')
const fs = require('fs')

const {
  tipMessage,
  sortDependencies,
  installDependencies,
  runLintFix,
  printMessage,
} = require('./utils')
const pkg = require('./package.json')

const templateVersion = pkg.version

const { addTestAnswers } = require('./scenarios')

tipMessage();

module.exports = {
  metalsmith: {
    // When running tests for the template, this adds answers for the selected scenario
    before: addTestAnswers
  },
  helpers: {
    if_or(v1, v2, options) {

      if (v1 || v2) {
        return options.fn(this)
      }

      return options.inverse(this)
    },
    template_version() {
      return templateVersion
    },
  },
  
  prompts: {
    name: {
      when: 'isNotTest',
      type: 'string',
      required: true,
      message: '项目名称:',
    },
    description: {
      when: 'isNotTest',
      type: 'string',
      required: false,
      message: '项目描述:',
      default: 'A Vue.js project',
    },
    author: {
      when: 'isNotTest',
      type: 'string',
      message: '项目作者:',
    },
    build: {
      when: 'isNotTest',
      type: 'list',
      message: 'Vue 运行模式:',
      choices: [
        {
          name: '1：Runtime + Compiler模式(推荐)',
          value: 'standalone',
          short: 'standalone',
        },
        {
          name: '2：Runtime-only模式',
          value: 'runtime',
          short: 'runtime',
        },
      ],
    },
    router: {
      when: 'isNotTest',
      type: 'confirm',
      message: '安装 vue-router 吗?',
    },
    lint: {
      when: 'isNotTest',
      type: 'confirm',
      message: '安装 ESLint 吗?',
    },
    lintConfig: {
      when: 'isNotTest && lint',
      type: 'list',
      message: '预设 ESLint 规范：',
      choices: [
        {
          name: '1：Standard (标准版)',
          value: 'standard',
          short: 'Standard',
        },
        {
          name: '2：Airbnb (Airbnb版)',
          value: 'airbnb',
          short: 'Airbnb',
        },
        {
          name: '3：不需要 (我自行配置)',
          value: 'none',
          short: 'none',
        },
      ],
    },
    unit: {
      when: 'isNotTest',
      type: 'confirm',
      message: '需要单元测试吗？',
    },
    runner: {
      when: 'isNotTest && unit',
      type: 'list',
      message: '单元测试模式：',
      choices: [
        {
          name: '1：Jest',
          value: 'jest',
          short: 'jest',
        },
        {
          name: '2：Karma and Mocha',
          value: 'karma',
          short: 'karma',
        },
        {
          name: '3：不需要 (我自行配置)',
          value: 'noTest',
          short: 'noTest',
        },
      ],
    },
    e2e: {
      when: 'isNotTest',
      type: 'confirm',
      message: '是否需要 e2e 测试?',
    },
    autoInstall: {
      when: 'isNotTest',
      type: 'list',
      message: '是否运行安装依赖关系',
      choices: [
        {
          name: '1：使用 NPM 方式',
          value: 'npm',
          short: 'npm',
        },
        {
          name: '2：使用 Yarn 方式',
          value: 'yarn',
          short: 'yarn',
        },
        {
          name: '3：不需要 (我自行配置)',
          value: false,
          short: 'no',
        },
      ],
    },
  },
  filters: {
    '.eslintrc.js': 'lint',
    '.eslintignore': 'lint',
    'config/test.env.js': 'unit || e2e',
    'build/webpack.test.conf.js': "unit && runner === 'karma'",
    'test/unit/**/*': 'unit',
    'test/unit/index.js': "unit && runner === 'karma'",
    'test/unit/jest.conf.js': "unit && runner === 'jest'",
    'test/unit/karma.conf.js': "unit && runner === 'karma'",
    'test/unit/specs/index.js': "unit && runner === 'karma'",
    'test/unit/setup.js': "unit && runner === 'jest'",
    'test/e2e/**/*': 'e2e',
    'src/router/**/*': 'router',
  },
  complete: function(data, { chalk }) {
    const green = chalk.green

    sortDependencies(data, green)

    const cwd = path.join(process.cwd(), data.inPlace ? '' : data.destDirName)

    if (data.autoInstall) {
      installDependencies(cwd, data.autoInstall, green)
        .then(() => {
          return runLintFix(cwd, data, green)
        })
        .then(() => {
          printMessage(data, green)
        })
        .catch(e => {
          console.log(chalk.red('Error:'), e)
        })
    } else {
      printMessage(data, chalk)
    }
  },
}
