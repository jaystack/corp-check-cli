#!/usr/bin/env node

import { WEBSITEURL, NPM_PACKAGE_NAME_PATTERN } from './constants';
import * as commander from 'commander';
const packageJson = require('../package.json');

import { validate_module, validate_package } from './validation';
import { resolvePackagePath, resolveRuleSetPath, readfile } from './resolvePath';
import { logger } from './logger';

commander.version(packageJson.version);

commander
  .command('validation [projectFolder]')
  .description('corp-check-cli')
  .option('--npm <package>', 'npm package - name[@version]')
  .option('--prod', 'production build')
  .option('--force, -f', 'force validation')
  .option('--verbose, -v', 'force validation')
  .option('--rule-set <ruleSetJson>', 'validation rule set, default: ./corp-check-rules.json')
  .option('--package-lock', 'use package-lock.json file')
  .option('--yarn-lock', 'use yarn.lock file')
  .option('--log-level <logLevel>', 'winston log level, default: warn')
  .action(async (projectFolder, command) => {
    try {
      logger.level = command.logLevel || 'warn';

      let ruleSet = undefined;
      try {
        const ruleSetPath = resolveRuleSetPath(command.ruleSet || projectFolder || '.');
        logger.log('debug', ruleSetPath);
        ruleSet = require(ruleSetPath);
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
            options.packageLock = JSON.parse(packageLockData);
          }
        }
        if (command.yarnLock) {
          const yarnLockData = await readfile(projectFolder, 'yarn.lock');
          if (yarnLockData) {
            options.yarnLock = yarnLockData;
          }
        }

        logger.log('debug', 'options', JSON.stringify(options, null, 2));

        const packageJSON = require(resolvePackagePath(projectFolder));
        data = await validate_package(packageJSON, options);
      } else if (command.npm) {
        logger.log('debug', 'options', JSON.stringify(options, null, 2));

        if (NPM_PACKAGE_NAME_PATTERN.test(command.npm)) {
          data = await validate_module(command.npm, options);
        } else {
          throw new Error('invalid parameters use --help');
        }
      } else {
        throw new Error('invalid parameters use --help');
      }

      if (data.result) {
        if (command.V || data.result.qualification === 'REJECTED') {
          const logPrefix = logType => {
            switch (logType) {
              case 'ERROR':
                return 'X';
              case 'INFO':
                return '√';
              case 'WARNING':
                return '!';
              default:
                break;
            }
          };

          const writeLogs = (node, path = []) => {
            const localPath = [ ...path, node.nodeName ];
            let isModuleNameDisplayed = false;
            for (const evaluation of node.evaluations) {
              const logs = evaluation.logs.filter(l => command.V || l.type === 'ERROR');
              if (command.V || logs.length) {
                if (!isModuleNameDisplayed) {
                  const nodePath = localPath.join(' > ');
                  console.log(nodePath);
                  let separator = '';
                  for (const i of nodePath) separator += '-';
                  console.log(separator);
                }

                isModuleNameDisplayed = true;
                for (const log of logs) {
                  console.log(`\t${logPrefix(log.type)} ${log.message}`);
                  logger.log('debug', JSON.stringify(log.meta));
                }
              }
            }

            if (isModuleNameDisplayed) console.log('');
            for (const dependency of node.dependencies) {
              writeLogs(dependency, localPath);
            }
          };

          writeLogs(data.result.rootEvaluation);
        }

        console.log(`Visit the ${WEBSITEURL}/result?cid=${data.cid} or use --verbose option for detailed result`);
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
        console.log(`corp-check validation failed: no result`);
        process.exit(1);
      }
    } catch (e) {
      logger.error(e);
      process.exit(1);
    }
  });

commander.parse(process.argv);
