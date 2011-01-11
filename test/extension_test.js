var extension = require("extensions"),
	assert = require("assert"),
	sys = require("sys");

var registry = extension.registry;
// turn down the console logging of errors. Default is true.
registry.verbose = false;

// Creates an extension point on demand, and adds a listener;
exports.testCreateExtensionPointOnDemand = function() {
	
	var result1 = registry.registerExtensionPoint("foobar", {onAddExtension: function(){}});
	assert.equal('object', typeof(result1));
	assert.equal('foobar', result1.name);
	var result1_getter = registry.extensionPoint("foobar");
	assert.strictEqual(result1, result1_getter)
	
	
	var result2 = registry.registerExtensionPoint("barbaz", function() {});
	assert.equal('object', typeof(result2));
	assert.equal('barbaz', result2.name);
	
	assert.notEqual(result1, result2);
	
	var badArgument = function(arg) {
		return function() {
			registry.registerExtensionPoint("foobar", arg);
		};
	}
	
	assert.throws(badArgument());
	assert.throws(badArgument(null));
	assert.throws(badArgument("a string"));
	assert.throws(badArgument([]));
	assert.throws(badArgument(1));
	
};

// Adding extensions
exports.testHappyCaseAddingExtensions = function() {
	var sum = 0;
	var totalizer = function(num) {
		sum += num;
	}
	
	registry.extensionPoint("integers").track(totalizer);
	assert.equal(0, sum);
	registry.extensionPoint("integers").addExtension(1); // 1
	registry.extensionPoint("integers").addExtension(2); // 2
	registry.extensionPoint("integers").addExtension(3); // 3
	assert.equal(6, sum);
	
	registry.extensionPoint("integers").disconnect();
};

// Adding extensions, with error resilience
exports.testErrorResilience = function () {
	var sum = 1024;
	var divisor = function(num) {
		// very silly extension tracker, which will error eventually.
		sum /= num;
	}
	
	registry.extensionPoint("integers").track(divisor);
	assert.equal(1024, sum);
	registry.extensionPoint("integers").addExtension(2);
	assert.equal(512, sum);
	registry.extensionPoint("integers").addExtension(1);
	assert.equal(512, sum);
	registry.extensionPoint("integers").addExtension(0);
	
	// we're still here.
	
	registry.extensionPoint("integers").disconnect();
};


//Adding extensions, store and forward
exports.testStoreAndForwardAdditions = function() {
	var sum = 0;
	var totalizer = function(num) {
		sum += num;
	}
	
	registry.extensionPoint("integers").addExtension(1); // 1
	registry.extensionPoint("integers").addExtension(2); // 2
	registry.extensionPoint("integers").addExtension(3); // 3
	
	assert.equal(0, sum);
	registry.extensionPoint("integers").track(totalizer);
	assert.equal(6, sum);
	
	registry.extensionPoint("integers").disconnect();
};

//Adding extensions, store and forward and removals.
exports.testStoreAndForwardRemovals = function () {
	var sum = 0;
	var totalizer = function(num) {
		sum += num;
	}
	
	registry.extensionPoint("integers").addExtension(1); // 1
	registry.extensionPoint("integers").addExtension(2); // 2
	registry.extensionPoint("integers").removeExtension(2); // 2
	registry.extensionPoint("integers").addExtension(3); // 3
	
	assert.equal(0, sum);
	registry.extensionPoint("integers").track(totalizer);
	assert.equal(4, sum);
	
	registry.extensionPoint("integers").disconnect();
};

//Adding extensions, remove all.
exports.testRemoveAll = function () {
	var sum = 0;
	var totalizer = function(num) {
		sum += num;
	}
	var untotalizer = function(num) {
		sum -= num;
	}
	
	registry.extensionPoint("integers").addExtension(1); // 1
	registry.extensionPoint("integers").addExtension(2); // 2
	registry.extensionPoint("integers").removeExtension(2); // 2
	registry.extensionPoint("integers").addExtension(3); // 3
	
	assert.equal(0, sum);
	registry.extensionPoint("integers").track({
		onAddExtension: totalizer, 
		onRemoveExtension: untotalizer,
		allowRemoveAll: true, // this is the default.
		
	});
	assert.equal(4, sum);
	
	registry.extensionPoint("integers").removeAll();
	assert.equal(0, sum);
	
	registry.extensionPoint("integers").disconnect();
};

//Adding argument list. Really deferred execution of the addExtension listener.
exports.testAddExtension_usingArgumentList = function () {
	var sum = 0;
	var totalizer = function(string, num) {
		sum += num;
	}
	
	registry.extensionPoint("strings").addExtension("A", 1); // 1
	registry.extensionPoint("strings").addExtension("B", 2); // 2
	registry.extensionPoint("strings").removeExtension("B"); // the extensions are indexed by the 0th arg.
	registry.extensionPoint("strings").addExtension("C", 3); // 3
	
	assert.equal(0, sum);
	registry.extensionPoint("strings").track(totalizer);
	assert.equal(4, sum);
	
	registry.extensionPoint("strings").disconnect();
};
	
/*
 * Now test the tracker objects
 */
exports.testExtensionCollectorList = function () {
	var list = [];
	var tracker = new extension.tracker.ExtensionsList(list);
	
	var name = "ExtensionsList"; // this is just an arbitrary name for the extension point
	
	registry.extensionPoint(name).addExtension(1);
	registry.extensionPoint(name).addExtension(2);
	registry.extensionPoint(name).addExtension(3);
	
	registry.extensionPoint(name).track(tracker);
	assert.deepEqual([1, 2, 3], list);
	
	registry.extensionPoint(name).removeExtension(1);
	assert.deepEqual([2, 3], list);

	// remove all doesn't, just for memory reasons.
	registry.extensionPoint(name).removeAll();
	assert.deepEqual([2, 3], list);
	registry.extensionPoint(name).disconnect();
};

// Override allowRemoveAll, to test remove all.
exports.testExtensionListRemoveAll = function () {
	var list = [];
	var tracker = new extension.tracker.ExtensionsList(list);
	tracker.allowRemoveAll = true;
	
	var name = "ExtensionsList"; // this is just an arbitrary name for the extension point
	
	registry.extensionPoint(name).addExtension(1);
	registry.extensionPoint(name).addExtension(2);
	registry.extensionPoint(name).addExtension(3);
	
	registry.extensionPoint(name).track(tracker);
	assert.deepEqual([1, 2, 3], list);
	
	registry.extensionPoint(name).removeAll();
	assert.deepEqual([], list);
};

// Test functionality of object full of extensions.
exports.testExtensionCollectorObject = function () {
	var obj = {};
	var tracker = new extension.tracker.ExtensionsObject(obj);
	
	var name = "ExtensionObject";
	
	registry.extensionPoint(name).addExtension(1, "one");
	registry.extensionPoint(name).addExtension(2, "two");
	registry.extensionPoint(name).addExtension(3, "three");
	
	registry.extensionPoint(name).track(tracker);
	assert.deepEqual({"1": "one", "2": "two", "3": "three"}, obj);
	
	registry.extensionPoint(name).removeExtension(1);
	assert.deepEqual({"2": "two", "3": "three"}, obj);
	
	// remove all doesn't, for memory reasons.
	registry.extensionPoint(name).removeAll();
	assert.deepEqual({"2": "two", "3": "three"}, obj);
};

exports.testShortCut = function(){
	assert.ok(typeof registry.extensionPoint("ep") !== 'undefined');
	assert.ok(typeof extension.extensionPoint("ep") !== 'undefined');
	assert.equal("ep", extension.extensionPoint("ep").name);
	assert.strictEqual(registry.extensionPoint("ep"), extension.extensionPoint("ep"));
};
