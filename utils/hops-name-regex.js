module.exports = function(searchName, targetName) {
  return RegExp(
    targetName
      .split(' ')
      .reduce(
        (acc, curr) => {
          return acc + `${curr.toLowerCase()}.*`;
        },
        ''
      )
  );
}
