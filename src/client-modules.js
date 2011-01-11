// largely inspired, if not wholesale copied from http://wiki.commonjs.org/wiki/Modules/CompiledModules
//
// library.js
//
var require = (function() {

	// memoized export objects
	var exportsObjects = {}

	// don't want outsider redefining "require" and don't want
	// to use arguments.callee so name the function here.
	var require = function(name) {
		if (exportsObjects.hasOwnProperty(name)) {
			return exportsObjects[name];
		}
		var exports = {};
		// memoize before executing module for cyclic dependencies
		exportsObjects[name] = exports;
		if (typeof (modules[name]) === 'undefined') {
			console.log("Module '" + name + "' has not been loaded (doesn't exist)");
		} else {
			modules[name](require, exports);
		}
		return exports;
	};

	return require;
})();

var run = function(name) {
	require(name); // doesn't return exports
};

var modules = {};

// added to use extensions. 
if (typeof (window) !== 'undefined') {
	window.onload = function() {
		var registry = require('extensions').registry;
		if (typeof registry !== 'undefined') {
			registry.extensionPoint('window.onload').track(
					function(onloadFunction) {
						if (typeof onloadFunction === 'function') {
							onloadFunction();
						}
					});
		}
	};
}
