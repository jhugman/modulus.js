var handlers = require('../../src/extensions.js').registry.extensionPoint("url.handlers");

handlers.addExtension(/^\/fizzbuzz/i, function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<h1>FizzBuzz</h1>');
	res.end();
	return true;
});