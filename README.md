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

Sandman runner

```javascript
var Sandman = require('sandman');

Sandman.run('/my/safe/root/with/untrusted/file.js', '/my/safe/root', { arg1: "some_argument", arg2: 42 }, function (err, finishedExports) {
  if(err) {
    throw err;
  }

  console.log(finishedExports.someValue);
});
```

Untrusted file runner

```javascript
var untrusted = require('untrusted');

var myValue = untrusted.fn(args.arg1, args.arg2);

// you have to call args.callback in order to properly end the process
args.callback(null, myValue);

```
