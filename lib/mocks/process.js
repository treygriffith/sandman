var testPath = require('../utils').testPath

module.exports = rootProcess;

function rootProcess(root) {
  var out = {};

  for(var p in process) {
    if(typeof process[p] === 'function') {
      out[p] = process[p].bind(process);
    } else {
      out[p] = process[p];
    }
  }

  out.setgroups = function () {
    throw new Error("Not allowed to set groups.");
  };

  out.initgroups = function () {
    throw new Error("Not allowed to create groups.");
  };

  out.setuid = function () {
    throw new Error("Not allowed to set uid.");
  };

  out.chdir = function (directory) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return process.chdir.apply(process, [].slice.call(arguments));
  };

  return out;
}
