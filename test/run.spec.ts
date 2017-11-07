import 'jest';
jest.mock('../src/resolvePath');
jest.mock('../src/logger');
jest.mock('request-promise-native');

const invalidParameterError = new Error('invalid parameters use --help');

const request = require('request-promise-native');
const logger = require('../src/logger').logger;
const loggerLog = logger.log;
const loggerInfo = logger.info;
const loggerError = logger.error;
const resolvePath = require('../src/resolvePath');
const exit = jest.spyOn(process, 'exit').mockImplementation(() => {});
const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});

import { actionHandler } from '../src/index';

describe('cli', async () => {
  beforeEach(() => {
    request.mockClear();
    loggerLog.mockClear();
    loggerInfo.mockClear();
    loggerError.mockClear();
    consoleLog.mockClear();
    resolvePath.readfile.mockClear();
  });

  describe('common', async () => {
    it('no params', async () => {
      await actionHandler(null, null, {});
      expect(exit).toHaveBeenCalledWith(1);
      expect(consoleLog.mock.calls).toEqual([]);
      expect(loggerLog.mock.calls).toEqual([]);
      expect(loggerError.mock.calls).toEqual([ [ invalidParameterError ] ]);
    });
  });

  describe('npm', async () => {
    it('invalid package name', async () => {
      await actionHandler(null, '@@[not-ALLOWED-value{}]', {});
      expect(exit).toHaveBeenCalledWith(1);

      expect(consoleLog.mock.calls).toEqual([]);
      expect(loggerLog.mock.calls).toEqual([ [ 'debug', 'options', '{}' ] ]);
      expect(loggerError.mock.calls).toEqual([ [ invalidParameterError ] ]);
    });

    it('packageName waits', async () => {
      const waitToEvaluationInterval = 100;
      expect(process.env.WAIT_TO_EVALUATION_INTERVAL).toEqual(undefined);
      process.env.WAIT_TO_EVALUATION_INTERVAL = waitToEvaluationInterval;

      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      const pendingResult = {
        state: {
          type: 'PENDING'
        }
      };
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }))
        .mockReturnValueOnce(Promise.resolve(pendingResult))
        .mockReturnValueOnce(Promise.resolve(pendingResult))
        .mockReturnValueOnce(Promise.resolve(pendingResult));
      await actionHandler(null, 'packageName', {});

      const packageCalls = {
        uri: 'https://api.corp-check.corpjs.com/package?cid=1',
        json: true
      };
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [ packageCalls ],
        [ packageCalls ],
        [ packageCalls ],
        [ packageCalls ]
      ]);

      delete process.env.WAIT_TO_EVALUATION_INTERVAL;
      expect(process.env.WAIT_TO_EVALUATION_INTERVAL).toEqual(undefined);
    });

    it('packageName RECOMMENDED', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', {});

      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);

      expect(consoleLog.mock.calls).toEqual([
        [ '' ],
        [ '\t----------------------' ],
        [ '\tError count: ', 0 ],
        [ '\tWarning count: ', 0 ],
        [ '\t----------------------' ],
        [ '' ],
        [ 'Visit the https://corp-check.corpjs.com/result?cid=1 or use --verbose option for detailed result' ],
        [ 'corp-check validation recommended' ]
      ]);
    });

    it('packageName ACCEPTED', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'ACCEPTED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [
                  { score: 0.4, logs: [ { message: 'msg1', type: 'WARNING' } ] },
                  { score: 1, logs: [] },
                  { score: 1, logs: [] }
                ],
                nodeScore: 0.4,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', {});

      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);

      expect(consoleLog.mock.calls).toEqual([
        [ '' ],
        [ '\tWarnings:' ],
        [ '\t\tmsg1 - (name)' ],
        [ '' ],
        [ '\t----------------------' ],
        [ '\tError count: ', 0 ],
        [ '\tWarning count: ', 1 ],
        [ '\t----------------------' ],
        [ '' ],
        [ 'Visit the https://corp-check.corpjs.com/result?cid=1 or use --verbose option for detailed result' ],
        [ 'corp-check validation accepted' ]
      ]);
    });

    it('packageName REJECTED', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'REJECTED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [
                  { score: 0, logs: [ { message: 'msg1', type: 'ERROR' } ] },
                  { score: 1, logs: [] },
                  { score: 1, logs: [] }
                ],
                nodeScore: 0,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', {});

      expect(exit).toHaveBeenCalledWith(1);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);

      expect(consoleLog.mock.calls).toEqual([
        [ '' ],
        [ '\tErrors:' ],
        [ '\t\tmsg1 - (name)' ],
        [ '' ],
        [ '\t----------------------' ],
        [ '\tError count: ', 1 ],
        [ '\tWarning count: ', 0 ],
        [ '\t----------------------' ],
        [ '' ],
        [ 'Visit the https://corp-check.corpjs.com/result?cid=1 or use --verbose option for detailed result' ],
        [ 'corp-check validation rejected' ]
      ]);
    });

    it('packageName FAILED', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'FAILED'
            },
            result: null
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', {});

      expect(exit).toHaveBeenCalledWith(1);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);

      expect(consoleLog.mock.calls).toEqual([
        [ 'Visit the https://corp-check.corpjs.com/result?cid=1 for more info' ],
        [ 'corp-check validation has no result' ],
        [ 'FAILED' ]
      ]);
    });

    it('force', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', { F: true });

      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: true,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('no verbose', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [
                  {
                    score: 1,
                    name: 'license',
                    logs: [
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' }
                    ]
                  },
                  { score: 1, name: 'version', logs: [] },
                  { score: 1, name: 'npm-scores', logs: [] }
                ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', {});

      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);

      expect(consoleLog.mock.calls).toEqual([
        [ '' ],
        [ '\tWarnings:' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\t...' ],
        [ '' ],
        [ '\t----------------------' ],
        [ '\tError count: ', 0 ],
        [ '\tWarning count: ', 11 ],
        [ '\t----------------------' ],
        [ '' ],
        [ 'Visit the https://corp-check.corpjs.com/result?cid=1 or use --verbose option for detailed result' ],
        [ 'corp-check validation recommended' ]
      ]);
    });

    it('verbose', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [
                  {
                    score: 1,
                    logs: [
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' },
                      { message: 'msg', type: 'WARNING' }
                    ]
                  },
                  { score: 1, logs: [] },
                  { score: 1, logs: [] }
                ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', { V: true });

      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);

      expect(consoleLog.mock.calls).toEqual([
        [ '' ],
        [ '\tWarnings:' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '\t\tmsg - (name)' ],
        [ '' ],
        [ '\t----------------------' ],
        [ '\tError count: ', 0 ],
        [ '\tWarning count: ', 11 ],
        [ '\t----------------------' ],
        [ '' ],
        [ 'Visit the https://corp-check.corpjs.com/result?cid=1 or use --verbose option for detailed result' ],
        [ 'corp-check validation recommended' ]
      ]);
    });

    it('packageName logLevel info', async () => {
      const waitToEvaluationInterval = 100;
      expect(process.env.WAIT_TO_EVALUATION_INTERVAL).toEqual(undefined);
      process.env.WAIT_TO_EVALUATION_INTERVAL = waitToEvaluationInterval;

      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }))
        .mockReturnValueOnce(Promise.resolve({ state: { type: 'PENDING', message: 'msg1' } }))
        .mockReturnValueOnce(Promise.resolve({ state: { type: 'PENDING', message: 'msg2' } }))
        .mockReturnValueOnce(Promise.resolve({ state: { type: 'PENDING', message: 'msg3' } }));
      await actionHandler(null, 'packageName', { logLevel: 'info' });

      const packageCalls = {
        uri: 'https://api.corp-check.corpjs.com/package?cid=1',
        json: true
      };
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [ packageCalls ],
        [ packageCalls ],
        [ packageCalls ],
        [ packageCalls ]
      ]);

      expect(loggerInfo.mock.calls).toEqual([ [ 'cid -', '1' ], [ 'msg1' ], [ 'msg2' ], [ 'msg3' ] ]);

      expect(consoleLog.mock.calls).toEqual([
        [ '' ],
        [ '\t----------------------' ],
        [ '\tError count: ', 0 ],
        [ '\tWarning count: ', 0 ],
        [ '\t----------------------' ],
        [ '' ],
        [ 'Visit the https://corp-check.corpjs.com/result?cid=1 or use --verbose option for detailed result' ],
        [ 'corp-check validation recommended' ]
      ]);

      delete process.env.WAIT_TO_EVALUATION_INTERVAL;
      expect(process.env.WAIT_TO_EVALUATION_INTERVAL).toEqual(undefined);
    });

    it('ruleSetJson default', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', {});

      expect(resolvePath.readfile).lastCalledWith('.', 'corp-check-rules.json');
      expect(exit).toHaveBeenCalledWith(0);
      '';
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('ruleSetJson custom', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"ruleSet": 1}'));
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler(null, 'packageName', { ruleSet: './testfolder' });

      expect(resolvePath.readfile).lastCalledWith('./testfolder', 'corp-check-rules.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageName: 'packageName',
              isProduction: undefined,
              ruleSet: '{"ruleSet": 1}',
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });
  });

  describe('project', async () => {
    it('invalid projectFolder', async () => {
      request.mockReturnValue(Promise.resolve({}));
      await actionHandler('.asdasdads.', null, {});
      expect(resolvePath.readfile).lastCalledWith('.asdasdads.', 'package.json');
      expect(request).not.toBeCalled();

      expect(exit).toHaveBeenCalledWith(1);
    });

    it('packageJSON waits', async () => {
      const waitToEvaluationInterval = 100;
      expect(process.env.WAIT_TO_EVALUATION_INTERVAL).toEqual(undefined);
      process.env.WAIT_TO_EVALUATION_INTERVAL = waitToEvaluationInterval;

      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      const pendingResult = {
        state: {
          type: 'PENDING'
        }
      };
      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }))
        .mockReturnValueOnce(Promise.resolve(pendingResult))
        .mockReturnValueOnce(Promise.resolve(pendingResult))
        .mockReturnValueOnce(Promise.resolve(pendingResult));
      await actionHandler('path_to_project', null, {});

      const packageCalls = {
        uri: 'https://api.corp-check.corpjs.com/package?cid=1',
        json: true
      };
      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [ packageCalls ],
        [ packageCalls ],
        [ packageCalls ],
        [ packageCalls ]
      ]);

      delete process.env.WAIT_TO_EVALUATION_INTERVAL;
      expect(process.env.WAIT_TO_EVALUATION_INTERVAL).toEqual(undefined);
    });

    it('packageJSON RECOMMENDED', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, {});

      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('packageJSON ACCEPTED', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'ACCEPTED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, {});

      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('packageJSON REJECTED', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'REJECTED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, {});

      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(1);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('packageJSON FAILED', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'FAILED'
            },
            result: null
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, {});

      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('force', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, { F: true });

      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: true,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('verbose', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, { V: true });

      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('logLevel', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, { logLevel: 'info' });

      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('prod', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, { prod: true });

      expect(resolvePath.readfile).lastCalledWith('path_to_project', 'package.json');
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: true,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('packageLock', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('packageLockContent'));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, { packageLock: true });

      expect(resolvePath.readfile.mock.calls).toEqual([
        [ 'path_to_project', 'corp-check-rules.json' ],
        [ 'path_to_project', 'package-lock.json' ],
        [ 'path_to_project', 'package.json' ]
      ]);
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: 'packageLockContent',
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('yarnLock', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('yarnLockContent'));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, { yarnLock: true });

      expect(resolvePath.readfile.mock.calls).toEqual([
        [ 'path_to_project', 'corp-check-rules.json' ],
        [ 'path_to_project', 'yarn.lock' ],
        [ 'path_to_project', 'package.json' ]
      ]);
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: 'yarnLockContent'
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('ruleSetJson default', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve(null));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, {});

      expect(resolvePath.readfile.mock.calls).toEqual([
        [ 'path_to_project', 'corp-check-rules.json' ],
        [ 'path_to_project', 'package.json' ]
      ]);
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: null,
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });

    it('ruleSetJson custom', async () => {
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"ruleSet": 1}'));
      resolvePath.readfile.mockReturnValueOnce(Promise.resolve('{"name:":"packageName","version":"version"}'));

      request
        .mockReturnValue(
          Promise.resolve({
            cid: '1',
            state: {
              type: 'SUCCEEDED'
            },
            result: {
              qualification: 'RECOMMENDED',
              rootEvaluation: {
                nodeName: 'name',
                nodeVersion: 'version',
                evaluations: [ { score: 1, logs: [] }, { score: 1, logs: [] }, { score: 1, logs: [] } ],
                nodeScore: 1,
                dependencies: []
              }
            }
          })
        )
        .mockReturnValueOnce(Promise.resolve({ cid: '1' }));
      await actionHandler('path_to_project', null, { ruleSet: './testfolder' });

      expect(resolvePath.readfile.mock.calls).toEqual([
        [ './testfolder', 'corp-check-rules.json' ],
        [ 'path_to_project', 'package.json' ]
      ]);
      expect(exit).toHaveBeenCalledWith(0);
      expect(request.mock.calls).toEqual([
        [
          {
            method: 'POST',
            uri: 'https://api.corp-check.corpjs.com/validation',
            json: true,
            body: {
              packageJSON: '{"name:":"packageName","version":"version"}',
              isProduction: undefined,
              ruleSet: '{"ruleSet": 1}',
              force: undefined,
              packageLock: undefined,
              yarnLock: undefined
            }
          }
        ],
        [
          {
            uri: 'https://api.corp-check.corpjs.com/package?cid=1',
            json: true
          }
        ]
      ]);
    });
  });
});
