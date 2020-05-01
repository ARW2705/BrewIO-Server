module.exports = function () {
  const args = Array.from(arguments);
  const error = new Error(args[1] || '');
  error.status = args[0] || 500;
  return error;
};
