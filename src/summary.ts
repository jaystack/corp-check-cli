const reduce = (reducer, accResult, node, path, depth) => {
  const rootValue = reducer(accResult, node, path);
  return path.length > depth + 1
    ? rootValue
    : (node.dependencies || [])
        .reduce(
          (acc, dependency) => reduce(reducer, acc, dependency, [ ...path, dependency.nodeName ], depth),
          rootValue
        );
};

export const reduceTree = (tree, reducer, initialResult, depth = Infinity) => {
  return reduce(reducer, initialResult, tree, [ tree.nodeName ], depth);
};

const sortByPathLength = items => items.sort((a, b) => a.path.length - b.path.length);

const sortBy = prop => names => items =>
  items.sort((a, b) => {
    const aIndex = names.indexOf(a[prop]) || Infinity;
    const bIndex = names.indexOf(b[prop]) || Infinity;
    return bIndex - aIndex;
  });

const groupBy = prop => items =>
  items.reduce((groups, item) => {
    const name = item[prop];
    const groupIndex = groups.findIndex(group => group.name === name);
    return groupIndex > -1
      ? groups.map((group, i) => (i === groupIndex ? { name: group.name, items: [ ...group.items, item ] } : group))
      : [ ...groups, { name, items: [ item ] } ];
  }, []);

const getItems = rootEvaluation =>
  reduceTree(
    rootEvaluation,
    (items, { evaluations }, path) =>
      evaluations.reduce(
        (items, { name, logs }) =>
          logs
            .filter(({ type }) => type !== 'INFO')
            .reduce((items, { type, message }) => [ ...items, { evaluation: name, type, message, path } ], items),
        items
      ),
    []
  );

const getCountBy = name => items => {
  return items.filter(({ type }) => type === name).length;
};

const groupByType = groupBy('type');
const groupByEvaluation = groupBy('evaluation');
const sortGroupBy = sortBy('name');
const sortGroupByType = sortGroupBy([ 'ERROR', 'WARNING' ]);
const sortGroupByEvaluation = sortGroupBy([ 'license', 'version' ]);

const flatGroups = array => array.reduce((prev, { items }) => [ ...prev, ...items ], []);

export const summary = rootEvaluation => {
  const unsortedItems = getItems(rootEvaluation);
  const sortedItems = flatGroups(
    sortGroupByType(
      groupByType(unsortedItems).map(({ name, items }) => ({
        name,
        items: flatGroups(
          sortGroupByEvaluation(groupByEvaluation(items)).map(({ name, items }) => ({
            name,
            items: sortByPathLength(items)
          }))
        )
      }))
    )
  );
  return {
    items: sortedItems,
    errorCount: getCountBy('ERROR')(sortedItems),
    warningCount: getCountBy('WARNING')(sortedItems)
  };
};
