var vm = require('vm')
  , fs = require('fs')
  , path = require('path')
  , resolve = require('resolve')
  , mockFs = require('./mocks/fs')
  , mockProcess = require('./mocks/process');

module.exports = runInSandbox;

function runInSandbox(filename, root, args, callback, cache) {
  cache = cache || {};

  fs.readFile(filename, 'utf8', function (err, src) {
    if(err) return callback(err);

    var out;

    try {
      out = run(filename, src, root, args, cache);

    } catch(e) {
      return callback(e);
    }

    callback(null, out);

  });
}

function runInSandboxSync(filename, root, cache) {

  cache = cache || {};

  return run(filename, fs.readFileSync(filename, 'utf8'), root, undefined, cache);
}

function run(filename, src, root, args, cache) {
  var sandbox, script;

  sandbox = buildSandbox(filename, root, args, cache);
  script = vm.createScript(wrap(src), filename);
  script.runInNewContext(sandbox);

  return sandbox.module.exports;
}

function buildSandbox(filename, root, args, cache) {

  // use our sandboxed fs, and null out any dangerous modules
  var mocks = {
    fs: mockFs(root),
    child_process: null,
    cluster: null,
    console: null,
    crypto: null,
    http: null,
    https: null,
    net: null,
    os: null,
    vm: null,
    repl: null,
  };

  var internalRequire = function(name) {
    if(mocks[name] !== undefined) {
      return mocks[name];
    }

    var resolved = internalRequire.resolve(name);

    // core module that isn't blacklisted, just require it
    if(resolved === name) {
      return require(name);
    }

    // save modules we've already required (and know are safe). Use the cache so that instanceof checks still work.

    if(!cache[resolved]) {
      cache[resolved] = runInSandboxSync(resolved, root, cache);
    }

    return cache[resolved];
  };

  internalRequire.resolve = function (name) {
    return resolve.sync(name, { basedir: path.dirname(filename) });
  };

  var exports = {};
  var base = {
    require: internalRequire,
    __filename: filename,
    __dirname: path.dirname(filename),
    process: mockProcess(root),
    console: console,
    exports: exports,
    args: args,
    module: {
        exports: exports
    },
    Buffer: Buffer,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    setImmediate: setImmediate
  };

  var sandbox = vm.createContext(base);
  sandbox.global = sandbox;

  return sandbox;
}

function wrap(src) {
  return ";(function(){\n" + src + "\n}).call(module.exports);\n";
}
