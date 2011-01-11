var di = require("di"),
	assert = require("assert"),
	sys = require("sys");

var injector = di.injector; 

// Test setSingleton
exports.testSetSingleton = function () {
	// it's not there
	assert.ok(typeof(injector.__objectFactories.sys) === 'undefined');
	
	// use a singleton of a random object - say the sys library.
	injector.setSingleton("sys", sys);
	
	// now it is; this is an internal data structure
	assert.strictEqual(sys, injector.__objectFactories.sys());
	
	// this is the public api.
	assert.strictEqual(sys, injector.findInstance("sys"));
	
	injector.reset(); // reset clears everything.
	// it's not there again. 
	assert.ok(typeof(injector.__objectFactories.sys) === 'undefined');
	assert.ok(injector.findInstance("sys") === null);
};

// test making aliases. This can be useful when you've multiple properties with different names.
exports.testAliases = function () {
	injector.setSingleton("original", "ORIGINAL");
	assert.equal("ORIGINAL", injector.findInstance("original"));
	assert.equal(null, injector.findInstance("alias"));
	
	injector.makeAlias("original", "alias");
	assert.equal("ORIGINAL", injector.findInstance("original"));
	assert.equal("ORIGINAL", injector.findInstance("alias"));

	// multiple arguments.
	injector.makeAlias("original", "alias_1", "alias_2", "alias_3");
	assert.equal("ORIGINAL", injector.findInstance("alias_1"));
	assert.equal("ORIGINAL", injector.findInstance("alias_2"));
	assert.equal("ORIGINAL", injector.findInstance("alias_3"));
	
};

// Very simple injection, of simple singletons, of "primitive" types.
exports.testSimpleInjection = function () {
	var MyObject = function() {
		this.string = null;
		this.number = null;
	}
	
	var my_object = new MyObject();
	
	injector.setSingleton("string", "A STRING");
	injector.setSingleton("number", 42);
	
	injector.inject(my_object);
	
	assert.equal("A STRING", my_object.string);
	assert.equal(42, my_object.number);
	
	injector.reset();
};

// Recursive injection.
exports.testRecursiveInjection = function () {
	var Node = function() {
		this.node_name = null;
		this.edge = null; 
	}
	
	var Edge = function() {
		this.edge_name = null;
		this.to_node = null;
	}

	injector.setSingleton("node_name", "InjectedNodeName");
	injector.setSingleton("edge_name", "InjectedEdgeName");
	injector.setSingleton("edge", new Edge());

	var node = new Node();
	assert.ok(node.edge === null);
	
	injector.inject(node);
	assert.ok(node.edge !== null);
	
	// we've injected the null properties into both node, and the injected edge.
	assert.equal("InjectedNodeName", node.node_name);
	assert.equal("InjectedEdgeName", node.edge.edge_name);
	assert.ok(node.edge.to_node === null);

	// Now add the edge manually, to make sure we're not recursing by mistake.
	node = new Node();
	node.edge = new Edge(); 
	
	injector.inject(node);
	assert.equal("InjectedNodeName", node.node_name);
	// we're adding an edge manually, so we shouldn't expect this to be injected into.
	assert.ok(node.edge.edge_name === null);
	
};

// a function "factory" which will be used to make integers on demand.
var counter = 0;
var intFactory = function() {
	counter = counter + 1;
	return counter;
};

// setFactory. Use some global state (or none) to generate an instance.
exports.testSetFactory = function () {
	
	injector.setFactory("integer", intFactory);
	assert.equal(1, injector.findInstance("integer"));
	assert.equal(2, injector.findInstance("integer"));
	
	// reset.
	counter = 0;
	
	
	var MyObject = function() {
		this.integer = null;
	}
	
	var instance1 = new MyObject();
	var instance2 = new MyObject();
	
	injector.inject(instance1);
	assert.equal(counter, instance1.integer);
	assert.equal(1, instance1.integer);
	
	injector.inject(instance2);
	assert.equal(counter, instance2.integer);
	assert.equal(2, instance2.integer);
	
	injector.reset();
};

/**
 * setClass(). Use a class object to create new instances of that class on the fly.
 */
exports.testSetClass = function () {
	var MyObject = function() {
		this.integer = null;
	};
	
	var testObj = new MyObject();

	injector.setClass("value", MyObject);
	injector.setSingleton("integer", 42);
	
	var obj = injector.findInstance("value");
	assert.ok(obj !== null);
	assert.equal(42, obj.integer);
	
	injector.reset();
};

/**
 * Synthetic properties; properties are injected from a map in object.inject. 
 * This take priority over null existing properties, but not over non-null properties.
 */
exports.testSyntheticProperties = function () {
	assert.ok(typeof(intFactory) !== 'undefined');
	injector.setFactory("integer", intFactory);
	counter = 0;
	var MyObject = function() {
		this.inject = {
			"foo": "integer",
			"bar": "integer",
			"baz": "integer",
			"bam": "integer"
		};
		
		this.integer = null;
		this.foo = null;
		this.bam = 123;
	};

	var instance = new MyObject();
	assert.ok(instance.hasOwnProperty("foo"));
	assert.ok(!instance.hasOwnProperty("bar"));
	assert.ok(!instance.hasOwnProperty("baz"));
	
	injector.inject(instance);
	assert.ok(instance.hasOwnProperty("foo"));
	assert.ok(instance.hasOwnProperty("bar"));
	assert.ok(instance.hasOwnProperty("baz"));
	
	assert.equal(1, instance.foo); // synthetic beats non-synthetic
	assert.equal(2, instance.bar);
	assert.equal(3, instance.baz);
	assert.equal(123, instance.bam); // non-null property wins all. 
	
	// existing properties injected after the 'synthetic' properties
	assert.equal(4, instance.integer);
	
	injector.reset();
};
