const hasDefaultIdType = require('./has-default-id');

const staticLibraryProperties = [
  'grainType',
  'hopsType',
  'yeastType',
  'style'
];

const defaultIdRegex = new RegExp(/^\d+$/);

module.exports = function removeDefaultIds(obj) {
  if (Array.isArray(obj)) {
    for (let item of obj) {
      if (typeof item === 'object' && item !== null) {
        removeDefaultIds(item);
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (staticLibraryProperties.includes(key)) continue;

      if ((key === '_id' || key === 'master') && hasDefaultIdType(obj[key])) {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeDefaultIds(obj[key]);
      }
    }
  }
}
