var sandbox = require('./sandbox')
  , debug = require('debug')('sandman');

function Client(interface) {
  this.interface = interface;
  this.timeout = 10000;
  this.interface.on('message', this._onMessage.bind(this));
}

// add our sandbox methods
for(var method in sandbox) {
  Client.prototype[method] = sandbox[method];
}

Client.prototype.start = function () {
  this.interface.on('uncaughtException', this._onUncaughtException.bind(this));

  debug('running '+this.filename+' in a sandbox with root '+this.root+' and arguments '+JSON.stringify(this.arguments));
  this.runInSandbox();
};

Client.prototype.sendError = function (err) {
  this.interface.send({ error: err.toString(), stack: err ? err.stack : null });
};

Client.prototype._callback = function (err, result) {

  if(err) {
    this.sendError(err);
    this.interface.exit(1);
    return;
  }

  debug('sandbox done running.');
  this.interface.send({result: result});

  this.interface.exit();

};

Client.prototype._onMessage = function (msg) {

  debug('message received by interface.');

  if(msg.filename) this.filename = msg.filename;
  if(msg.root) this.root = msg.root;
  if(msg.arguments) this.arguments = msg.arguments;

  if(this.filename && this.root) {
    this.start();
  }
};

Client.prototype._onUncaughtException = function (err) {
  this.sendError(err);
  this.interface.exit(1);
};

// start the client
new Client(process);
