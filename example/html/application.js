(function () {
	var registry = require("extensions").registry;
	
	var onload = function() {
		tabPanel = require("tabPanel");
		tabPanel.displayTabs("my-tabs");
	}

	registry.extensionPoint("window.onload").addExtension(onload);
	
})();
