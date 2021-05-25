exports.populationPaths = [
  { path: 'style' },
  { path: 'variants.grains.grainType' },
  { path: 'variants.hops.hopsType' },
  { path: 'variants.yeast.yeastType' }
];

exports.meetsMinimumVariantCount = (update, recipeMaster) => {
  return recipeMaster.variants.length < 2
    && update.isMaster !== undefined
    && !update.isMaster
};
