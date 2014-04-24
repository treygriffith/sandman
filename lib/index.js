var fork = require('child_process').fork
  , path = require('path')
  , interfacePath = require.resolve('./interface');

module.exports = Sandman;

function Sandman(filename, root) {

  this.interface = fork(interfacePath, {
    cwd: root,
    env: {}
  });

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
      var err = new Error(msg.error);
      err.stack = msg.stack;
      console.log("stack:", msg.stack);
      return callback(err);
    }
    if(msg.done) {
      return callback(null, msg.done);
    }
  });

  this.interface.on('exit', function () {
    callback(new Error("interface exited before sending any messages."));
  });

};


