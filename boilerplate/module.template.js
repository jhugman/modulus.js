
(function () {
	var moduleName = "moduleName";
	var module = function (require, exports) {
		/*
		 * This is the body of the module. It should be executable using client-modules.js style require
		 * or a standard require.
		 */
	};
	
	
	if (typeof(modules) !== 'undefined') {
		// so we may be in a browser context, and want to delay construction until we're required.
		modules[moduleName] = module;
	} else {
		// otherwise do it. Now. 
		module(require, exports);
	}	
})();