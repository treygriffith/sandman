Sandman
=======

A container for running untrusted(-ish) Node.js programs.

If you're in any kind of multi-tenant environment where you're automatically running Node.js written by other people, or using modules that you haven't seen ahead of time, just running them is quite dangerous - even accidentally. A malicious (or poorly written) module would have access to your environment variables, any files that Node has access to, and can start programs and connect to outside servers.

If you have a multi-tenant environment purely for hosting Node.js to be executed (a la Heroku), containerization and virtual machines are a much better solution. But if untrusted Node.js is a small side effect of your application, Sandman provides a comparatively simple and low overhead way to execute code.

Usage
-----

### Basic Usage

entrypoint.js

```javascript
var untrusted = require('untrusted');

module.exports = function (arg1, arg2, callback) {
  var myValue = untrusted(arg1, arg2);

  callback(null, myValue);
};
```

runner.js

```javascript
var Sandman = require('sandman');

Sandman.run('./entrypoint.js', '/path/to/safe/root', [arg1, arg2], function (err, myValue) {
  if(err) throw err;

  console.log(myValue); // outputs the result of `untrusted(arg1, arg2)`
});
```

When you run Sandman on your entrypoint file, it will call the resulting `module.exports` with your arguments and a callback. Call the callback when you've run your untrusted modules.


### Advanced Usage

#### Constructor

You can have more control over the Sandman instance by using the constructor:

```javascript
var sandman = new Sandman("./entrypoint.js", "/some/safe/root");
```

The Sandman instance exposes the following properties and methods:

- `interface` a [ChildProcess](http://nodejs.org/api/child_process.html#child_process_class_childprocess) connected to the Sandman client. This can be used to [send messages and sockets](http://nodejs.org/api/child_process.html#child_process_child_send_message_sendhandle) to your entrypoint file.
- `run` - Start the entrypoint file. Called with an array of arguments and a callback.
- `_onMessage` - Listens for [`message`](http://nodejs.org/api/child_process.html#child_process_event_message) from the client. Change it before calling `run`.
- `_onError` - Listens for [`error`](http://nodejs.org/api/child_process.html#child_process_event_error) from the client. Change it before calling `run`.
- `_onExit` - Listens for [`exit`](http://nodejs.org/api/child_process.html#child_process_event_exit) from the client. Change it before calling `run`.

#### Client

Within the entrypoint file, you can access the client by doing:

```javascript
var sandmanClient = require('sandman')
```

The Sandman Client exposes the following methods and properties:

- `arguments` array of arguments called on `Sandman#run`. (these are applied to the entrypoint file's `module.exports` function)
- `callback` Callback to be called when the entrypoint file is done. (this is the last argument supplied to the entrypoint file's `module.exports` function)
- `root` the secure root that Sandman was called in
- `filename` the entrypoint file name. (this is also available on the global scope in `__filename`)
- `interface` An alias for `process`, this is used to communicate with the Sandman constructor via `Client#interface.send`
- `sendError` A sugary method for sending errors to the Sandman constructor (used internally when `callback`'s first parameter is an error)

Be **warned** - do not pass the client to any untrusted code - it *probably* has everything you need to break out of the jailed environment in a hot second.


About
-----

### Security

This isn't truly secure, and there likely isn't a way to make Node.js secure at the application level (See [this discussion](https://groups.google.com/forum/#!topic/nodejs-dev/9vApf6IvRxk)). Instead, this module provides a way to execute Node.js code that should prevent against most kinds of bad stuff, intentional or unintentional.

### Features

- Operates in a new process, and every module in its own [context](http://nodejs.org/api/vm.html)
- No `fs` access outside the defined `root`
- Cannot change the current working directory to be outside of `root`
- Cannot change uid or gid
- Timeout to kill runaway processes
- Cannot `require` files outside of `root` that are not inside `node_modules`
- No access to dangerous core modules:
  - child_process
  - cluster
  - http
  - https
  - net
  - tls
  - dgram
  - vm
  - repl

The key difference between Sandman and most other sandboxing libraries is that the entire dependency chain is contained. So, for example, requiring `fs-extra`, which in turn requires `fs` will not get you outside the sandbox.

### Limitations

The most obvious limitation is the attack surface area - there are almost certainly ways to exploit this kind of sandboxing, so don't rely on it for anything super important.

Most specifically, because `require` calls are not contained to the `root` directory the way that `fs` calls are, it is possible to `require` a file that is outside of your `root`, giving a potential attacker access to potentially sensitive data. This is mitigated by only allowing `require`s on files outside of the `root` if they are contained in a `node_modules` directory, but that's hardly bulletproof.

The other limitation is one of speed and memory. Each Sandman instance creates a new process, and each dependency is put in a [new context](http://nodejs.org/api/vm.html). This is much lower overhead than OS level sandboxing, but you obviously can't have tons of these (i.e. thousands) on a single machine.
