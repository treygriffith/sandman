Sandman
=======

A container for running untrusted(-ish) Node.js programs.


Security
--------
This isn't truly secure, and there likely isn't a way to make Node.js secure at the application level. Instead, this module provides a way to execute Node.js code that should prevent against most kinds of unintentional bad stuff.

Features
--------
Sandman operates in a separate process from the parent process, and every module is executed in a virtual machine that is locked down.

Specifically, the modules can't access files (through `fs`) outside of the defined `root`. The modules are also unable to change the current working directory, and can't `require` dangerous node modules. The list of blacklisted modules is below:

- child_process
- cluster
- http
- https
- net
- tls
- dgram
- vm
- repl

The key difference between Sandman and most other sandboxing libraries is that the entire dependency chain is similarly contained. So requiring `fs-extra`, which in turn requires `fs` will not get you outside the sandbox.

Limitations
-----------
The most obvious limitation is the attack surface area - there are almost certainly ways to exploit this kind of sandboxing, so don't rely on it for anything super important.

Most specifically, because `require` calls are not contained to the `root` directory the way that `fs` calls are, it is possible to `require` a file that is outside of your `root`, giving a potential attacker access to potentially sensitive data.

The other limitation is one of speed and memory. Each Sandman instance creates a new process, and each dependency is put in its own virtual machine. So obviously you can't have tons of these on a single machine.

Usage
-----

For Sandman to work properly, you need to have an entrypoint file that knows its a Sandman client.
This entry point file is used to get data from the parent process into your untrusted modules, get data back out,
and to notify the parent when it's finished executing.

Fortunately, it's easy. The entrypoint file needs to interact through two global variables:

- `args` contains any data passed through Sandman.run (which goes through JSON sanitization), and should be used to pass data to the untrusted code.
- `callback` is a function to be executed with the familiar `(err, result)` pattern at the conclusion of the program. The result should contain any primitive data to be returned to the Sandman.run callback. Note that the process will exit after this function is called.

Here's an example entry point file, called entrypoint.js:

```javascript
var untrustedModule = require('untrusted');

var myValue = untrusted.beBad(args.someValue, args.someOtherValue);

// call callback in order to properly end the process
callback(null, myValue);

```

From there you just need to call your entrypoint file using Sandman with a restricted root, like so:

```javascript

Sandman.run('./entrypoint.js', '/path/to/restricted/root', { arg1: "some_argument", arg2: 42 }, function (err, myValue) {
  
  console.log(myValue); // outputs the reuslt of untrusted.beBad
});
```


