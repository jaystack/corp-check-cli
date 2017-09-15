#!/usr/bin/env node

import { WEBSITEURL, PACKAGE_NAME_REGEX } from './constants';
import * as commander from 'commander';
var packageJson = require('../package.json');

import { validate_module, validate_package } from './validation';
import { resolvePackagePath } from './resolvePath';
import { logger } from './logger';

commander.version(packageJson.version);

commander
  .command('validation [packagePath]')
  .description('corp-check-cli')
  .option('--npm <package>', 'npm package - name[@version]')
  .option('--log-level <logLevel>', 'winston log level')
  .action(async (packagePath, command) => {
    try {
      logger.level = command.logLevel || 'warn';
      
      let data: any = {};
      if (packagePath) {
        const packageJSON = require(resolvePackagePath(packagePath));
        data = await validate_package(packageJSON);
      } else if (command.npm) {
        const matches = PACKAGE_NAME_REGEX.exec(command.npm);
        if (matches) {
          data = await validate_module(matches[1], matches[6]);
        } else {
          throw new Error('invalid parameters use --help');
        }
      } else {
        throw new Error('invalid parameters use --help');
      }

      if (data.result) {
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
