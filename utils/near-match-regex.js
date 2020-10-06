module.exports = function(searchName, targetName) {
  return RegExp(
    searchName
      .split(' ')
      .reduce(
        (acc, curr) => {
          return acc + `${curr.toLowerCase()}.*`;
        },
        ''
      )
  )
  .test(targetName.toLowerCase());
}
