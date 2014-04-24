var runInSandbox = require('./sandbox')
  , debug = require('debug')('sandman');

process.on('message', function (msg) {
  debug('message received by interface.');

  if(!msg.filename || !msg.root) {
    return sendErr("No filename or root specified.");
  }

  debug('running '+msg.filename+' in a sandbox with root '+msg.root+' and args '+JSON.stringify(msg.args));
  runInSandbox(msg.filename, msg.root, msg.args, function (err, ret) {
    if(err) {
      sendErr(err);
      process.exit(1);
    }

    debug('sandbox done running.');
    process.send({done: ret});
    process.exit();
  });

  process.on('uncaughtException', function (err) {
    sendErr(err);
    process.exit(1);
  });
});

function sendErr(err) {
  process.send({ error: err.toString(), stack: err ? err.stack : null });
}
