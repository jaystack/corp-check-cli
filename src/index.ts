#!/usr/bin/env node

import { WEBSITEURL, NPM_PACKAGE_NAME_PATTERN } from './constants';
import * as commander from 'commander';
const packageJson = require('../package.json');

import { validate_module, validate_package } from './validation';
import { resolvePackagePath, resolveRuleSetPath } from './resolvePath';
import { logger } from './logger';

commander.version(packageJson.version);

commander
  .command('validation [packagePath]')
  .description('corp-check-cli')
  .option('--npm <package>', 'npm package - name[@version]')
  .option('--prod', 'production build')
  .option('--force, -f', 'force validation')
  .option('--verbose, -v', 'force validation')
  .option('--rule-set <ruleSetJson>', 'validation rule set default: ./corp-check-rules.json')
  .option('--log-level <logLevel>', 'winston log level')
  .action(async (packagePath, command) => {
    try {
      logger.level = command.logLevel || 'warn';

      let ruleSet = undefined;
      try {
        const ruleSetPath = resolveRuleSetPath(command.ruleSet || packagePath || '.');
        logger.log('debug', ruleSetPath);
        ruleSet = require(ruleSetPath);
      } catch (e) {
        logger.log('debug', 'ruleSet resolve error');
        logger.log('debug', e);
      }

      const options = {
        isProduction: command.prod,
        ruleSet,
        force: command.F
      };

      logger.log('debug', 'options', JSON.stringify(options, null, 2));

      let data: any = {};
      if (packagePath) {
        const packageJSON = require(resolvePackagePath(packagePath));
        data = await validate_package(packageJSON, options);
      } else if (command.npm) {
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
          for (const evaluation of data.result.evaluations) {
            console.log('\t -', evaluation.description);
            for (const log of evaluation.logs) {
              console.log('\t\t -', log.type, ' - ', log.message);
              logger.log('debug', JSON.stringify(log.meta));
            }
          }
        }

        switch (data.result.qualification) {
          case 'ACCEPTED':
            console.log(`corp-check validation accepted`);
            console.log(`visit ${WEBSITEURL}/result?cid=${data.cid} for more info`);
            return process.exit(0);
          case 'RECOMMENDED':
            console.log(`corp-check validation recommended`);
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
