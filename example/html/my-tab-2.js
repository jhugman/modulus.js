(function () {
	var tabs = require("extensions").registry.extensionPoint("my-tabs");
	tabs.addExtension({
		name	: "Tab 2",
		color	: "#ff8888"
	});
})();