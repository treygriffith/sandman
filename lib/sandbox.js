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
    self._callback.apply(self, [].slice.call(arguments));
  };

  debug('reading entrypoint file: '+this.filename);

  fs.readFile(this.filename, 'utf8', function (err, src) {
    if(err) return callback(err);

    debug('executing '+this.filename);

    try {
      self.exec(self.filename, src, {}, true);
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

exports.exec = function(filename, src, parent, isEntrypoint) {
  var sandbox, script;

  sandbox = this.buildSandbox(filename, parent, isEntrypoint);
  script = vm.createScript(wrap(src), filename);
  script.runInContext(sandbox);

  return sandbox.module;
};

exports.buildSandbox = function(filename, parent, isEntrypoint) {

  var module = {
    require: this.require(filename, isEntrypoint),
    id: filename,
    loaded: true, // not sure what to put here
    parent: parent,
    children: [],
    exports: {}
  };

  var sandbox = vm.createContext({
    require: this.require(filename, module, isEntrypoint),
    __filename: filename,
    __dirname: path.dirname(filename),
    process: mockProcess(this.root),
    console: console,
    exports: module.exports,
    module: module,
    Buffer: Buffer,
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    setImmediate: setImmediate
  });

  sandbox.global = sandbox;

  return sandbox;
};

exports.require = function (filename, module, isEntrypoint) {

  var self = this,
      mocks = this.mocks(isEntrypoint);

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
      self.cache[resolved] = self.safeRequire(resolved, module);
    }

    module.children.push(self.cache[resolved]);

    return self.cache[resolved].exports;
  };

  _require.resolve = function (name) {
    return resolve.sync(name, { basedir: path.dirname(filename) });
  };

  return _require;

};

exports.mocks = function (isEntrypoint) {
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

  return mocks;
};

exports.safeRequire = function(filename, parent) {
  return this.exec(filename, fs.readFileSync(filename, 'utf8'), parent);
};
