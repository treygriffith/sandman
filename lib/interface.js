var runInSandbox = require('./sandbox');

process.on('message', function (msg) {
  if(!msg.filename || !msg.root) {
    return sendErr("No filename or root specified.");
  }

  runInSandbox(msg.filename, msg.root, msg.args, function (err, exports) {
    if(err) return sendErr(err);

    process.send({done: exports});
  });

  process.on('uncaughtException', function (err) {
    sendErr(err);
    process.exit(1);
  });
});

function sendErr(err) {
  process.send({ error: err.toString(), stack: err ? err.stack : null });
}
