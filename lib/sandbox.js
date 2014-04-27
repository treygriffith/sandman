var vm = require('vm')
  , fs = require('fs-extra')
  , path = require('path')
  , testPath = require('./utils').testPath
  , wrap = require('./utils').wrap
  , wrapEntrypoint = require('./utils').wrapEntrypoint
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

    debug('executing '+self.filename);

    try {
      self.exec(self.createModule(self.filename, {}), src, true);
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

exports.exec = function(module, src, isEntrypoint) {
  var sandbox, script, wrapped;

  wrapped = isEntrypoint ? wrapEntrypoint(src) : wrap(src);
  script = vm.createScript(wrapped, module.id);

  sandbox = this.buildSandbox(module, isEntrypoint);
  
  script.runInContext(sandbox);

  return sandbox.module;
};

exports.buildSandbox = function(module, isEntrypoint) {

  var sandbox = vm.createContext({
    // this is the same as module.require unless `isEntrypoint` is true
    require: this.require(module, isEntrypoint),
    __filename: module.id,
    __dirname: path.dirname(module.id),
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

exports.require = function (module, isEntrypoint) {

  var self = this,
      mocks = this.mocks(isEntrypoint);

  var _require = function(name) {

    if(mocks[name]) {
      return mocks[name];
    }

    // core module that isn't blacklisted, just require it
    if(resolve.isCore(name)) {
      return require(name);
    }

    var resolved = _require.resolve(name);

    // don't require outside of the root if it's not part of node_modules
    if(!testPath(resolved, self.root) && !~resolved.indexOf(path.sep + 'node_modules' + path.sep)) {
      throw new Error(resolved + " is outside of the root.");
    }

    // save modules we've already required (and know are safe). Use the cache so that instanceof checks still work.
    if(!self.cache[resolved]) {
      self.cache[resolved] = self.createModule(resolved, module);

      // if it's JSON, don't exec it
      if(resolved.slice('.json'.length * -1).toLowerCase() === '.json') {
        self.cache[resolved].exports = fs.readJsonSync(resolved);
      } else {
        self.exec(self.cache[resolved], fs.readFileSync(resolved, 'utf8'));
      }
    }

    // add it to the children
    if(!~module.children.indexOf(self.cache[resolved])) {
      module.children.push(self.cache[resolved]);
    }

    return self.cache[resolved].exports;
  };

  _require.resolve = function (name) {
    return resolve.sync(name, { basedir: path.dirname(module.id), extensions: ['.js', '.json'] });
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

  // give them access to a limited sandman client. require('sandman') for access
  // only available from the entrypoint file
  if(isEntrypoint) {
    mocks.sandman = {
      arguments: this.arguments,
      root: this.root,
      filename: this.filename,
      callback: this.callback,
      interface: this.interface,
      sendError: this.sendError.bind(this)
    };
  }

  return mocks;
};

exports.createModule = function (filename, parent) {
  var module = {
    id: filename,
    loaded: true, // not sure what to put here
    parent: parent,
    children: [],
    exports: {}
  };

  // module.require is never a dangerous version
  module.require = this.require(module);

  return module;
};
