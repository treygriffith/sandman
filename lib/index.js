var fork = require('child_process').fork
  , path = require('path');

module.exports = function (filename, root, args, _callback) {

  callback = function () {
    _callback.apply(null, [].slice.call(arguments));
    _callback = function () {};
  };

  var child = fork(require.resolve('./fork'), {
    cwd: root,
    env: {}
  });

  child.on('error', function (err) {
    callback(err);
  });

  child.send({
    filename: filename,
    root: root,
    args: args
  });

  child.on('message', function (msg) {
    if(!msg) return callback(new Error("Unintelligible reply from child."));
    if(msg.error) {
      var err = new Error(msg.error);
      err.stack = msg.stack;
      console.log("stack:", msg.stack);
      return callback(err);
    }
    if(msg.done) {
      return callback(null, msg.done);
    }

    console.log("not sure what we're ooking at here...", msg);
  });

  child.on('exit', function () {
    callback(new Error("child exited before sending any messages."));
  });
};


