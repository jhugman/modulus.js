/***************************************************
Create a HTTP server
***************************************************/

var http = require("http");
var httpRouter = require("./router.js").router;



exports.server = http.createServer(
    function(req, res) {
        if (!httpRouter.route(req.url, [req, res])) {
            res.writeHead(404, {});
            res.write('<h1>404 Not found</h1>');
            res.write('<h3>' + req.url + '</h3>');
            res.close();
        }
    }
);

