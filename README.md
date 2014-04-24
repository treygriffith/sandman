Sandman
=======

A container for running untrusted(-ish) Node.js programs.

About
-----

### Security

This isn't truly secure, and there likely isn't a way to make Node.js secure at the application level. Instead, this module provides a way to execute Node.js code that should prevent against most kinds of unintentional bad stuff.

### Features

- Operates in a new process, and every module in its own virtual machine and context
- No `fs` access outside the defined `root`
- Cannot change the current working directory
- Cannot change uid or gid
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

The key difference between Sandman and most other sandboxing libraries is that the entire dependency chain is contained. So requiring `fs-extra`, which in turn requires `fs` will not get you outside the sandbox.

### Limitations

The most obvious limitation is the attack surface area - there are almost certainly ways to exploit this kind of sandboxing, so don't rely on it for anything super important.

Most specifically, because `require` calls are not contained to the `root` directory the way that `fs` calls are, it is possible to `require` a file that is outside of your `root`, giving a potential attacker access to potentially sensitive data.

The other limitation is one of speed and memory. Each Sandman instance creates a new process, and each dependency is put in its own virtual machine. So obviously you can't have tons of these on a single machine.

Usage
-----

### Basic Usage

For Sandman to work properly, you need to have an entrypoint file that knows its a Sandman client.
This entry point file is used to get data from the parent process into your untrusted modules, get data back out,
and to notify the parent when it's finished executing.

Fortunately, it's easy. The entrypoint file just needs to `require('sandman')`, which exposes two properties:

- `args` contains any data passed through Sandman.run (which goes through JSON sanitization), and should be used to pass data to the untrusted code.
- `callback` is a function to be executed with the familiar `(err, result)` pattern at the conclusion of the program. The result should contain any primitive data to be returned to the Sandman.run callback. Note that the process will exit after this function is called.

Here's an example entry point file, called entrypoint.js:

```javascript
var untrustedModule = require('untrusted');
var sandman = require('sandman');

var myValue = untrusted.beBad(sandman.args.someValue, sandman.args.someOtherValue);

// call callback in order to properly end the process
sandman.callback(null, myValue);

```

From there you just need to call your entrypoint file using Sandman with a restricted root, like so:

```javascript

Sandman.run('./entrypoint.js', '/path/to/restricted/root', { someValue: "some_argument", someOtherValue: 42 }, function (err, myValue) {
  
  console.log(myValue); // outputs the reuslt of untrusted.beBad
});
```

### Advanced Usage

#### Constructor

You can have more control over the Sandman instance by using the constructor:

```javascript
var sandman = new Sandman("./entrypoint.js", "/some/safe/root");
```

The sandman object exposes an `interface` which can be used to send messages (and sendHandles) to your entrypoint file. The interface is just a [ChildProcess](http://nodejs.org/api/child_process.html#child_process_class_childprocess).

Sandman also has three `interface` event handlers, `_onMessage`, `_onError`, and `_onExit`, which correspond to the [`message`]((http://nodejs.org/api/child_process.html#child_process_event_message), [`error`](http://nodejs.org/api/child_process.html#child_process_event_error), and [`exit`](http://nodejs.org/api/child_process.html#child_process_event_exit) events. You can override those handlers to define new behaviors.

To start the entrypoint file, just use the `run` method, which accepts an arguments object and a callback as its paramters.

#### Client

Within the entrypoint file, you can access the Sandman client by calling `require('sandman')`, like in the Basic Usage section above. This Sandman client exposes the same properties as the Sandman constructor:

- `args` see above
- `callback` see above
- `root` the secure root that Sandman was called in
- `filename` the entrypoint file. (this is also available on the global scope in `__filename`)
- `interface` An alias for `process`, this is used to communicate with the Sandman constructor via `Client#interface.send`

Plus lots of other goodies that you can check out in the source. But be **warned** - do not pass the client to any untrusted code - it has everything you need to break out of the jailed environment in a hot second.

