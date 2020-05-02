const staticLibraryProperties = [
  'grainType',
  'hopsType',
  'yeastType',
  'style'
];

const defaultIdRegex = RegExp('^[0-9]+', 'g');

module.exports = function removeDefaultIds => {
  if (Array.isArray(obj)) {
    for (let item of obj) {
      if (typeof item === 'object' && item !== null) {
        removeDefaultIds(item);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (staticLibraryProperties.includes(key)) continue;

      if (key === '_id' && defaultIdRegex.test(key)) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeDefaultIds(obj[key]);
      }
    }
  }
};
