(function () {
	var tabs = require("extensions").registry.extensionPoint("my-tabs");
	tabs.addExtension({
		name	: "Tab 1",
		color	: "#8888ff"
	});
})();