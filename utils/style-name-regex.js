module.exports = function(searchName, targetName) {
  return RegExp(
    searchName
      .split(' ')
      .reduce(
        (acc, curr, index) => {
          const lowered = curr.toLowerCase();
          if (!index) {
            return lowered;
          }
          return acc + `.+${lowered}`;
        },
        ''
      )
  )
  .test(targetName.toLowerCase());
}
