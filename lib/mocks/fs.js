var realFs = require('fs')
  , testPath = require('../utils').testPath
  , Stream = require('stream').Stream
  , Readable = Stream.Readable
  , Writable = Stream.Writable;

module.exports = rootFs;

var notImplemented = function () {
  throw new Error("Not Implemented");
};

function rootFs(root) {
  var fs = {};

  fs.rename = function (oldPath, newPath, callback) {
    if(!testPath(oldPath, root)) {
      return callback(new Error(oldPath + " is outside the root."));
    }
    if(!testPath(newPath, root)) {
      return callback(new Error(newPath + " is outside the root."));
    }
    return realFs.rename.apply(realFs, [].slice.call(arguments));
  };

  fs.renameSync = function (oldPath, newPath) {
    if(!testPath(oldPath, root)) {
      throw new Error(oldPath + " is outside the root.");
    }
    if(!testPath(newPath, root)) {
      throw new Error(newPath + " is outside the root.");
    }
    return realFs.renameSync.apply(realFs, [].slice.call(arguments));
  };

  fs.ftruncate = notImplemented;
  fs.ftruncateSync = notImplemented;

  fs.truncate = function (path, len, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.truncate.apply(realFs, [].slice.call(arguments));
  };
  fs.truncateSync = function (path, len) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.truncateSync.apply(realFs, [].slice.call(arguments));
  };

  fs.chown = function (path, uid, gid, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.chown.apply(realFs, [].slice.call(arguments));
  };
  fs.chownSync = function (path, uid, gid) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.chownSync.apply(realFs, [].slice.call(arguments));
  }; 

  fs.fchown = notImplemented;
  fs.fchownSync = notImplemented;

  fs.lchown = function (path, uid, gid, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.lchown.apply(realFs, [].slice.call(arguments));
  };
  fs.lchownSync = function (path, uid, gid) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.lchownSync.apply(realFs, [].slice.call(arguments));
  };
  fs.chmod = function (path, mode, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.chmod.apply(realFs, [].slice.call(arguments));
  };
  fs.chmodSync = function (path, mode) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.chmodSync.apply(realFs, [].slice.call(arguments));
  }; 

  fs.fchmod = notImplemented;
  fs.fchmodSync = notImplemented;

  fs.lchmod = function (path, mode, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.lchmod.apply(realFs, [].slice.call(arguments));
  };
  fs.lchmodSync = function (path, mode) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.lchmodSync.apply(realFs, [].slice.call(arguments));
  }; 

  fs.stat = function (path, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.stat.apply(realFs, [].slice.call(arguments));
  };
  fs.statSync = function (path) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.statSync.apply(realFs, [].slice.call(arguments));
  };
  fs.lstat = function (path, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.lstat.apply(realFs, [].slice.call(arguments));
  };
  fs.lstatSync = function (path) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.lstatSync.apply(realFs, [].slice.call(arguments));
  };

  // file descriptors
  fs.fstat = notImplemented;
  fs.fstatSync = notImplemented;

  fs.link = function (srcPath, destPath, callback) {
    if(!testPath(srcPath, root)) {
      return callback(new Error(srcPath + " is outside the root."));
    }
    if(!testPath(destPath, root)) {
      return callback(new Error(destPath + " is outside the root."));
    }
    return realFs.link.apply(realFs, [].slice.call(arguments));
  };

  fs.linkSync = function (srcPath, destPath, callback) {
    if(!testPath(srcPath, root)) {
      throw new Error(srcPath + " is outside the root.");
    }
    if(!testPath(destPath, root)) {
      throw new Error(destPath + " is outside the root.");
    }
    return realFs.linkSync.apply(realFs, [].slice.call(arguments));
  };

  fs.symlink = function (srcPath, destPath, type_, callback) {
    callback = arguments[arguments.length - 1];

    if(!testPath(srcPath, root)) {
      return callback(new Error(srcPath + " is outside the root."));
    }
    if(!testPath(destPath, root)) {
      return callback(new Error(destPath + " is outside the root."));
    }
    return realFs.symlink.apply(realFs, [].slice.call(arguments));
  };

  fs.symlinkSync = function (srcPath, destPath, type_) {
    if(!testPath(srcPath, root)) {
      throw new Error(srcPath + " is outside the root.");
    }
    if(!testPath(destPath, root)) {
      throw new Error(destPath + " is outside the root.");
    }
    return realFs.symlinkSync.apply(realFs, [].slice.call(arguments));
  };
  fs.readlink = function (path, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.readlink.apply(realFs, [].slice.call(arguments));
  };
  fs.readlinkSync = function (path) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.readlinkSync.apply(realFs, [].slice.call(arguments));
  };
  fs.realpath = function (path, cache, callback) {
    callback = arguments[arguments.length - 1];
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.realpath.apply(realFs, [].slice.call(arguments));
  };
  fs.realpathSync = function (path, cache) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.realpathSync.apply(realFs, [].slice.call(arguments));
  };
  fs.unlink = function (path, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.unlink.apply(realFs, [].slice.call(arguments));
  };
  fs.unlinkSync = function (path) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.unlinkSync.apply(realFs, [].slice.call(arguments));
  };
  fs.rmdir = function (path, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.rmdir.apply(realFs, [].slice.call(arguments));
  };
  fs.rmdirSync = function (path) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.rmdirSync.apply(realFs, [].slice.call(arguments));
  };
  fs.mkdir = function (path, mode_, callback) {
    callback = arguments[arguments.length - 1];
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.mkdir.apply(realFs, [].slice.call(arguments));
  };
  fs.mkdirSync = function (path, mode_) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.mkdirSync.apply(realFs, [].slice.call(arguments));
  };
  fs.readdir = function (path, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.readdir.apply(realFs, [].slice.call(arguments));
  };
  fs.readdirSync = function (path) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.readdirSync.apply(realFs, [].slice.call(arguments));
  };

  // file descriptors
  fs.close = notImplemented;
  fs.closeSync = notImplemented;
  fs.open = notImplemented;
  fs.openSync = notImplemented;

  fs.utimes = function (path, atime, mtime, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.utimes.apply(realFs, [].slice.call(arguments));
  };
  fs.utimesSync = function (path, atime, mtime) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.utimesSync.apply(realFs, [].slice.call(arguments));
  };

  // file descriptors
  fs.futimes = notImplemented;
  fs.futimesSync = notImplemented;
  fs.fsync = notImplemented;
  fs.fsyncSync = notImplemented;
  fs.write = notImplemented;
  fs.writeSync = notImplemented;
  fs.read = notImplemented;
  fs.readSync = notImplemented;

  fs.readFile = function (path, options_, callback) {
    callback = arguments[arguments.length - 1];
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.readFile.apply(realFs, [].slice.call(arguments));
  };
  fs.readFileSync = function (path, options_) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.readFileSync.apply(realFs, [].slice.call(arguments));
  };
  fs.writeFile = function (path, data, options_, callback) {
    callback = arguments[arguments.length - 1];
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.writeFile.apply(realFs, [].slice.call(arguments));
  };
  fs.writeFileSync = function (path, data, options_) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.writeFileSync.apply(realFs, [].slice.call(arguments));
  };
  fs.appendFile = function (path, data, options_, callback) {
    callback = arguments[arguments.length - 1];
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.appendFile.apply(realFs, [].slice.call(arguments));
  };
  fs.appendFileSync = function (path, data, options_) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.appendFileSync.apply(realFs, [].slice.call(arguments));
  };

  fs.watchFile = notImplemented;
  fs.unwatchFile = notImplemented;
  fs.watch = notImplemented;

  fs.exists = function (path, callback) {
    if(!testPath(path, root)) {
      return callback(new Error(path + " is outside the root."));
    }
    return realFs.exists.apply(realFs, [].slice.call(arguments));
  };
  fs.existsSync = function (path) {
    if(!testPath(path, root)) {
      throw new Error(path + " is outside the root.");
    }
    return realFs.existsSync.apply(realFs, [].slice.call(arguments));
  };

  fs.createReadStream = function (path, options_) {
    if(!testPath(path, root)) {
      var stream = new Readable();

      process.nextTick(function () {
        stream.emit('error', new Error(path + " is outside the root."));
      });
      return stream;
    }

    return realFs.createReadStream.apply(realFs, [].slice.call(arguments));
  };
  fs.createWriteStream = function (path, options_) {
    if(!testPath(path, root)) {
      var stream = new Writable();

      process.nextTick(function () {
        stream.emit('error', new Error(path + " is outside the root."));
      });
      return stream;
    }

    return realFs.createWriteStream.apply(realFs, [].slice.call(arguments));
  };

  return fs;
}
