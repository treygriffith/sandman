var vm = require('vm')
  , fs = require('fs')
  , path = require('path')
  , testPath = require('./utils').testPath
  , wrap = require('./utils').wrap
  , resolve = require('resolve')
  , mockFs = require('./mocks/fs')
  , mockProcess = require('./mocks/process')
  , debug = require('debug')('sandman');

exports.runInSandbox = function() {
  var self = this;

  this.cache = {};
  this.callbackCalled = false;

  var callback = this.callback = function () {
    debug('vm returned or timeout was reached.');
    self.callbackCalled = true;
    self._callback.apply(null, [].slice.call(arguments));
  };

  debug('reading entrypoint file: '+this.filename);

  fs.readFile(this.filename, 'utf8', function (err, src) {
    if(err) return callback(err);

    debug('executing '+this.filename);

    try {
      run(self.filename, src, self.root, self.cache, self.args, callback);
    } catch(e) {
      return callback(e);
    }

    debug(self.filename + ' executed successfully.');

    // set a timer on when we need to get out of here

    setTimeout(function () {
      if(!self.callbackCalled) {
        callback(new Error("Timeout of "+self.timeout+"ms reached before a response."));
      }
    }, self.timeout);

  });

};

exports.exec = function(filename, src) {
  var sandbox, script;

  sandbox = buildSandbox(filename, this.root, this.cache, this.args, this.callback);
  script = vm.createScript(wrap(src), filename);
  script.runInContext(sandbox);

  return sandbox.module.exports;
};

exports.buildSandbox = function(filename, isEntrypoint) {

  // use our sandboxed fs, and null out any dangerous modules
  var mocks = {
    fs: mockFs(this.root),
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

  // if there is a callback defined then this is the entry point.
  // give them access to the sandman client. let them require sandman to get access to it
  if(isEntrypoint) {
    mocks.sandman = this;
  }

  var exports = {};
  var base = {
    require: this.require(filename, mocks),
    __filename: filename,
    __dirname: path.dirname(filename),
    process: mockProcess(this.root),
    console: console,
    exports: exports,
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
};

exports.require = function (filename, mocks) {

  var self = this;

  var _require = function(name) {

    if(mocks[name]) {
      return mocks[name];
    }

    var resolved = _require.resolve(name);

    // core module that isn't blacklisted, just require it
    if(resolved === name) {
      return require(name);
    }

    // don't require outside of the root if it's not part of node_modules
    if(!testPath(resolved, self.root) && !~resolved.indexOf(path.sep + 'node_modules' + path.sep)) {
      throw new Error(resolved + " is outside of the root.");
    }

    // save modules we've already required (and know are safe). Use the cache so that instanceof checks still work.
    if(!self.cache[resolved]) {
      self.cache[resolved] = self.safeRequire(resolved);
    }

    return self.cache[resolved];
  };

  _require.resolve = function (name) {
    return resolve.sync(name, { basedir: path.dirname(filename) });
  };

  return _require;

};

exports.safeRequire = function(filename) {
  return this.exec(filename, fs.readFileSync(filename, 'utf8'));
};
