/*
 * The main guts of the router. 
 */

/**
 * @constructor
 * @param handlers {array} of pairs of regular expressions and functions.
 */
var URLRouter = function (handlers) {
	this.__handlers = handlers;
};

/**
 * A server would use this to route the arguments to a handler.
 * @param {string} url A file path from the suffix of a URL. 
 */
URLRouter.prototype.route = function (url, args) {
	for (var i in this.__handlers) {
		var regexp = this.__handlers[i][0];
		var func = this.__handlers[i][1];
		if (regexp.exec(url)) {
	        func.apply(null, args);
	        return true;
		}
	}
	return false;
};

/*
 * Make it extendable
 */

var createExtendableRouter = function (extensionPointName) {
	var extensions = require('../../src/extensions.js');
	var handlers = [];
	extensions.registry.
		extensionPoint(extensionPointName).
		track(new extensions.tracker.ExtensionsList(handlers));
	
	return new URLRouter(handlers);
};


exports.router = createExtendableRouter("url.handlers");
exports.createExtendableRouter = createExtendableRouter;