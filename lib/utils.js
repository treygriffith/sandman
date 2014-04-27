var Path = require('path');

exports.testPath = function testPath(path, root) {
  var resolved = Path.resolve(path);
  if(resolved.slice(0, root.length) === root) {
    // it's within the root
    return true;
  } else if(!~resolved.indexOf(Path.sep + 'node_modules' + Path.sep)) {
    // it's within a `node_modules` folder
    return true;
  } else {
    // not allowed
    return false;
  }
};

exports.wrap = function (src) {
  return ";(function(){\n" + src + "\n}).call(module.exports);\n";
};

exports.wrapEntrypoint = function (src) {
  var wrapped = exports.wrap(src) +
  "module.exports.apply(this, require('sandman').arguments.concat(require('sandman').callback));\n";

  return wrapped;
};
