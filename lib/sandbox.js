var vm = require('vm')
  , fs = require('fs')
  , path = require('path')
  , testPath = require('./utils').testPath
  , resolve = require('resolve')
  , mockFs = require('./mocks/fs')
  , mockProcess = require('./mocks/process')
  , debug = require('debug')('sandman')
  , timeout = 10000;

module.exports = runInSandbox;

function runInSandbox(filename, root, args, cb, cache) {
  cache = cache || {};
  args = args || {};

  var callbackCalled = false;

  var callback = function () {
    debug('vm returned or timeout was reached.');
    callbackCalled = true;
    cb.apply(null, [].slice.call(arguments));
  };

  debug('reading entrypoint file');

  fs.readFile(filename, 'utf8', function (err, src) {
    if(err) return callback(err);

    var out;


    try {
      out = run(filename, src, root, cache, args, callback);

    } catch(e) {
      return callback(e);
    }

    debug(filename + ' executed successfully.');

    // set a timer on when we need to get out of here

    setTimeout(function () {
      if(!callbackCalled) {
        callback(new Error("Timeout of "+timeout+"ms reached before a response."));
      }
    }, timeout);

  });
}

function runInSandboxSync(filename, root, cache) {

  cache = cache || {};

  return run(filename, fs.readFileSync(filename, 'utf8'), root, cache);
}

function run(filename, src, root, cache, args, callback) {
  var sandbox, script;

  sandbox = buildSandbox(filename, root, cache, args, callback);
  script = vm.createScript(wrap(src), filename);
  script.runInNewContext(sandbox);

  return sandbox.module.exports;
}

function buildSandbox(filename, root, cache, args, callback) {

  // use our sandboxed fs, and null out any dangerous modules
  var mocks = {
    fs: mockFs(root),
    child_process: {},
    cluster: {},
    http: {},
    https: {},
    net: {},
    tls: {},
    dgram: {},
    vm: {},
    repl: {}
  };

  var internalRequire = function(name) {
    if(mocks[name]) {
      return mocks[name];
    }

    var resolved = internalRequire.resolve(name);

    // core module that isn't blacklisted, just require it
    if(resolved === name) {
      return require(name);
    }

    // don't require outside of the root if it's not part of node_modules
    if(!testPath(resolved, root) && !~resolved.indexOf(path.sep + 'node_modules' + path.sep)) {
      throw new Error(resolved + " is outside of the root.");
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
    callback: callback,
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
