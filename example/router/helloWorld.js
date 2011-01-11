var handlers = require('../../src/extensions.js').registry.extensionPoint("url.handlers");

handlers.addExtension(/^\/hello/i, function(req, res) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.write('<h1>Hello World</h1>');
	res.end();
	return true;
});