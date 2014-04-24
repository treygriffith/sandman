var Path = require('path');

exports.testPath = function testPath(path, root) {
  var resolved = Path.resolve(path);
  if(resolved.slice(0, root.length) === root) {
    return true;
  }
  return false;
};
