#!/usr/bin/env node

import { getWebEndpoint, NPM_PACKAGE_NAME_PATTERN } from './constants';
import * as commander from 'commander';
const packageJson = require('../package.json');

import { validate_module, validate_package } from './validation';
import { resolvePackagePath, resolveRuleSetPath, readfile } from './resolvePath';
import { logger } from './logger';
import { advanced } from './result';

export const actionHandler = async (projectFolder, npmModule, command) => {
  try {
    logger.level = command.logLevel || 'warn';

    let ruleSet = undefined;
    try {
      const ruleSetPath = resolveRuleSetPath(command.ruleSet || projectFolder || '.');
      logger.log('debug', ruleSetPath);
      ruleSet = JSON.stringify(require(ruleSetPath));
    } catch (e) {
      logger.log('debug', 'ruleSet resolve error');
      logger.log('debug', e);
    }

    const options = {
      isProduction: command.prod,
      ruleSet,
      force: command.F,
      packageLock: undefined,
      yarnLock: undefined
    };

    let data: any = {};
    if (projectFolder) {
      if (command.packageLock) {
        const packageLockData = await readfile(projectFolder, 'package-lock.json');
        if (packageLockData) {
          options.packageLock = packageLockData;
        }
      }
      if (command.yarnLock) {
        const yarnLockData = await readfile(projectFolder, 'yarn.lock');
        if (yarnLockData) {
          options.yarnLock = yarnLockData;
        }
      }

      logger.log('debug', 'options', JSON.stringify(options, null, 2));

      const packageJSON = await readfile(projectFolder, 'package.json');
      data = await validate_package(packageJSON, options);
    } else if (npmModule) {
      logger.log('debug', 'options', JSON.stringify(options, null, 2));

      if (NPM_PACKAGE_NAME_PATTERN.test(npmModule)) {
        data = await validate_module(npmModule, options);
      } else {
        throw new Error('invalid parameters use --help');
      }
    } else {
      throw new Error('invalid parameters use --help');
    }

    if (data.result) {
      advanced(data, command);

      console.log(`Visit the ${getWebEndpoint()}/result?cid=${data.cid} or use --verbose option for detailed result`);
      switch (data.result.qualification) {
        case 'RECOMMENDED':
          console.log(`corp-check validation recommended`);
          return process.exit(0);
        case 'ACCEPTED':
          console.log(`corp-check validation accepted`);
          return process.exit(0);
        case 'REJECTED':
        default:
          console.log(`corp-check validation rejected`);
          process.exit(1);
      }
    } else {
      console.log(`Visit the ${getWebEndpoint()}/result?cid=${data.cid} for more info`);
      console.log(`corp-check validation has no result`);
      console.log(`${data.state.type}`);
      process.exit(1);
    }
  } catch (e) {
    logger.error(e.message || e);
    process.exit(1);
  }
};

commander
  .version(packageJson.version)
  .option('--force, -f', 'force validation')
  .option('--verbose, -v', 'list all warnings')
  .option('--rule-set <ruleSetJson>', 'validation rule set, default: ./corp-check-rules.json')
  .option('--log-level <logLevel>', 'winston log level, default: warn');

commander
  .arguments('<projectFolder>')
  .description('validate your project folder')
  .option('--prod', 'skip devDependencies')
  .option('--package-lock', 'use package-lock.json file')
  .option('--yarn-lock', 'use yarn.lock file')
  .action(async (projectFolder, command) => {
    return await actionHandler(projectFolder, null, command);
  });

commander
  .command('npm <packageName>')
  .description('[@scope/]packageName[@version]]')
  .action(async (packageName, command) => {
    return await actionHandler(null, packageName, command);
  });

commander.parse(process.argv);
