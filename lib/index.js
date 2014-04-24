var fork = require('child_process').fork
  , path = require('path')
  , interfacePath = require.resolve('./interface');

module.exports = function (filename, root, args, _callback) {

  callback = function () {
    _callback.apply(null, [].slice.call(arguments));
    _callback = function () {};
  };

  var interface = fork(interfacePath, {
    cwd: root,
    env: {}
  });

  interface.on('error', function (err) {
    callback(err);
  });

  interface.send({
    filename: filename,
    root: root,
    args: args
  });

  interface.on('message', function (msg) {
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

    console.log("not sure what we're ooking at here...", msg);
  });

  interface.on('exit', function () {
    callback(new Error("interface exited before sending any messages."));
  });
};


