var fork = require('child_process').fork
  , path = require('path')
  , debug = require('debug')('sandman')
  , interfacePath = require.resolve('./interface');

module.exports = Sandman;

function Sandman(filename, root) {

  this.filename = filename;
  this.root = root;

  this.interface = fork(interfacePath, {
    cwd: root,
    env: {}
  });

  debug('child process interface created.');

}

Sandman.run = function(filename, root, args, cb) {
  var sandman = new Sandman(filename, root);
  sandman.run(args, cb);

  return sandman;
};

Sandman.prototype.run = function (args, cb) {

  var callback = function () {
    cb.apply(null, [].slice.call(arguments));
    cb = function () {};
  };

  this.interface.on('error', function (err) {
    callback(err);
  });

  this.interface.on('message', function (msg) {
    if(!msg) return callback(new Error("Unintelligible reply from interface."));
    if(msg.error) {
      var err = new Error(msg.error.message || msg.error.toString());
      err.stack = msg.stack;
      debug('received error from interface:');
      debug(msg.stack);
      return callback(err);
    }

    callback(null, msg.done);
  });

  this.interface.on('exit', function () {
    callback(new Error("interface exited before sending any messages."));
  });

  debug('sending start command to interface...');
  this.interface.send({ filename: this.filename, root: this.root, args: args });

};


