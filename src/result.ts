import { logger } from './logger';
import { summary } from './summary';

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

export const simple = (data, command) => {
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
  if (command.V || data.result.qualification === 'REJECTED') {
    writeLogs(data.result.rootEvaluation);
  }
};

export const advanced = (data, command) => {
  const result = summary(data.result.rootEvaluation);

  const writeItems = items => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (i < 10 || command.V) {
        console.log(`\t\t${item.message} - (${item.path.join(' > ')})`);
      } else {
        console.log('\t\t...');
        break;
      }
    }
  };

  const errors = result.items.filter(i => i.type === 'ERROR');
  if (errors.length) {
    console.log('');
    console.log('\tErrors:');
    writeItems(errors);
  }

  const warnings = result.items.filter(i => i.type === 'WARNING');
  if (warnings.length) {
    console.log('');
    console.log('\tWarnings:');
    writeItems(warnings);
  }

  console.log('');
  console.log('\t----------------------');
  console.log('\tError count: ', result.errorCount);
  console.log('\tWarning count: ', result.warningCount);
  console.log('\t----------------------');
  console.log('');
};
