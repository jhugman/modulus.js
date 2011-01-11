
(function () {
	var moduleName = "tabPanel";
	var module = function (require, exports) {

		/*
		 * The actual re-usable code.
		 */
		exports.displayTabs = function (extensionPointName) {
			
			require("extensions").registry.extensionPoint(extensionPointName).track(
				function (tabObj) {
					// we have a new tab, what are we going to do with it?
					console.log(tabObj.name);
				}
			);
		};
		
		
	};
	
	
	// some boiler plate to make it runnable in the 
	// so we may be in a browser context, and want to delay construction until we're required.
	modules[moduleName] = module;

})();