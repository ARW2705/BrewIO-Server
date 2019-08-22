module.exports = (dest, source) => {
  if (source) {
    for (const key in source) {
      if (dest.hasOwnProperty(key)) {
        dest[key] = source[key];
      }
    }
  }
};
