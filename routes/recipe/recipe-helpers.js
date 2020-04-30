exports.populationPaths = [
  { path: 'style' },
  { path: 'variants.grains.grainType' },
  { path: 'variants.hops.hopsType' },
  { path: 'variants.yeast.yeastType' }
];

exports.populateAll = (query) => {
  return query
    .populate('style')
    .populate('variants.grains.grainType')
    .populate('variants.hops.hopsType')
    .populate('variants.yeast.yeastType');
};
