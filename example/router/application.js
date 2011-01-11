var httpServer = require("./httpServer.js").server;

require('./helloWorld.js');
require('./fizzbuzz.js');

var port = 8080;

httpServer.listen(port);
console.log('HTTP Server running at http://127.0.0.1:' + port);

