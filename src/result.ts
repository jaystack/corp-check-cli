import { getListing } from 'corp-check-core';

export const displayResult = (data, command) => {
  const result = getListing(data.result.rootEvaluation)

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
