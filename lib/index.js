var fork = require('child_process').fork
  , path = require('path')
  , debug = require('debug')('sandman')
  , interfacePath = require.resolve('./interface');

module.exports = Sandman;

function Sandman(filename, root) {

  this.filename = filename;
  this.root = root;
  this.callback = function () {};
  this.interface = fork(interfacePath, {
    cwd: this.root,
    env: {
      DEBUG: process.env.DEBUG
    }
  });

  debug('child process interface created.');
}

Sandman.run = function(filename, root, args, cb) {
  var sandman = new Sandman(filename, root);
  sandman.run(args, cb);

  return sandman;
};

Sandman.prototype.setListeners = function () {

  this.interface.on('error', this._onError.bind(this));
  this.interface.on('message', this._onMessage.bind(this));
  this.interface.on('exit', this._onExit.bind(this));

  debug('listening to interface.');

  return this.interface;
};

Sandman.prototype.setCallback = function (cb) {
  this.callback = function () {
    cb.apply(null, [].slice.call(arguments));
    cb = function () {};
  };

  return this.callback;
};

Sandman.prototype.run = function (args, cb) {

  this.setCallback(cb);
  this.args = args;

  this.start();
};

Sandman.prototype.start = function () {
  this.setListeners();

  debug('sending start command to interface...');
  this.interface.send({ filename: this.filename, root: this.root, args: this.args });
};

/**
 * Interface Event Handlers.
 */

Sandman.prototype._onError = function (err) {
  this.callback(err);
};

Sandman.prototype._onMessage = function () {
  if(!msg) return this.callback(new Error("Unintelligible reply from interface."));

  if(msg.error) {
    var err = new Error(msg.error.message || msg.error.toString());
    err.stack = msg.stack;
    debug('received error from interface:');
    debug(err.name);
    debug(err.message);
    debug(msg.stack);
    return this.callback(err);
  }

  if(msg.done !== undefined) {
    debug('done running sandman');
    this.callback(null, msg.done);
  }
};

Sandman.prototype._onExit = function () {
  this.callback(new Error("interface exited before sending any messages."));
};


