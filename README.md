modulus.js
==========

A collection of lightweight tools for writing modular javascript.

What?
-----

A set of tools inspired by [OSGi][osgi-wp] module system and Eclipse [plugins][plugins-wp]:

[osgi-wp]: https://secure.wikimedia.org/wikipedia/en/wiki/OSGi
[plugins-wp]: https://secure.wikimedia.org/wikipedia/en/wiki/Plug-in_%28computing%29

What??
------

So now we have browsers running on big machines, servers written in Javascript, and now mobile apps being written in 
Javascript, it's increasingly likely we're working large and complex codebases.

The organization and wiring up of the code is becoming as much part of the cognitive load as the processing that solves the problem.

This set of tools is meant to help with that: 

* client-modules.js provides a subset of [CommonJS/Modules](http://wiki.commonjs.org/wiki/Modules/1.1) functionality in the browser. There's some boiler plate in the boilerplate directory to help writing modules that will run on a browser, and loading them so as to preserve debugging information.
* extensions.js provides an extension/extension mechanism.
* di.js provides property based dependency injection.



Usage
-----
I found out today that it's quite hard to have an example small enough to be explanatory, but large enough to be pointful.

### Problem:
An HTTP server needs to be able to handle multiple URL paths. Each path can be expressed as a pattern, and the handler is 
a function.

### Collecting request handlers
The server needs to be able to gather up all the pattern/handler pairs contributed to it by other modules:
    
    var extensions = require('extensions');
    var urlHandlers = extensions.extensionPoint('url.handlers'); // an agreed upon, but opaque string.

    urlHandlers.track(function (regexp, handler) { // <--- gets called whenever...
        routes.push([regexp, handler]);
    } 

### Contributing request handlers
In another module, a developer has written a new handler. Instead of touching the server module:

    var extensions = require('extensions');
    var urlHandlers = extensions.extensionPoint('url.handlers');
    
    urlHandlers.addExtension(/users\/(\d+)/, userHandler); // <-- ...this is called.

If no-one is tracking the extension point at time of adding a new extension, then the extension is saved until 
someone does. This allows for order-independence of module loading.

Documentation
-------------
This is an initial release, so the inline documentation hasn't been processed yet (it's there, just not in HTML). 

The tests should be reasonably complete and well commented. These will require node.js to run.

Installation
------------
Copy the contents of src into your src directory. You don't need to worry about the tests.

Note on Patches/Pull Requests
-----------------------------
 
* Fork the project.
* Make your feature addition or bug fix.
* Add tests for it. This is important so I don't break it in a
  future version unintentionally.
* Commit, do not mess with version or history.
  (if you want to have your own version, that is fine but bump version in a commit by itself I can ignore when I pull)
* Send me a pull request. Bonus points for topic branches.

Copyright
---------
Copyright (c) 2011 jhugman. See LICENSE for details. 
Released under the Apache v2 licence.

