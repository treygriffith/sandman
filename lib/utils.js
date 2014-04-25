var Path = require('path');

exports.testPath = function testPath(path, root) {
  var resolved = Path.resolve(path);
  if(resolved.slice(0, root.length) === root) {
    return true;
  }
  return false;
};

exports.wrap = function (src) {
  return ";(function(){\n" + src + "\n}).call(module.exports);\n";
};

exports.wrapEntrypoint = function (src) {
  return wrap(src) + "module.exports.apply(this, require('sandman').arguments.concat(require('sandman').callback, require('sandman')) (require('sandman'));\n";
};
