
(function () {
	var module = function (require, exports) {
		var extension = exports;
		
		/*
		 * some utility methods for calling methods from method names 
		 */
		var __invoke_method = function(fn, methodName, args) {
			try {
				return fn.apply(null, args);
			} catch(err) {
				console.log("Exception thrown while invoking " + methodName + ":\n" + fn);
				console.log("Arguments: " + args);
				console.log(err);
				throw err;
			}
		};
		
		var __apply_onAddExtension = function(extensionPoint, extension) {
			extension = exports.objectFactory(extension);
			__invoke_method(extensionPoint.api.onAddExtension, extensionPoint.name + '.onAddExtension', extension);
			return extension;
		};
		
		var __apply_onRemoveExtension = function(extensionPoint, extension) {
			__invoke_method(extensionPoint.api.onRemoveExtension, extensionPoint.name + '.onRemoveExtension', extension);
			return extension;
		};
		
		
		// the extension point object. 
		// this is not supposed to be instantiable outside of this file.
		
		/**
		 * @class
		 * Represents a point where extensions can be added and tracked.
		 * @private
		 */
		var ExtensionPoint = function (reg) {
			this.__registry = reg;
		};
		
		/**
		 * The arguments are passed to the tracker for this extension point.
		 * <p>If no such tracker exists, the arguments are stored until a tracker is added.</p>
		 * <code>
		 * 	extensions.registry.extensionPoint('my_widget').addExtension(ButtonWidget);
		 * </code>
		 * @param arguments
		 */
		ExtensionPoint.prototype.addExtension = function () {
			var extensionPoint = this;
			var extension = arguments;
			
			var api = extensionPoint.api;
			if (api) {
				extension = __apply_onAddExtension(extensionPoint, extension);
			}
			if (!api || typeof(api.allowRemoveAll) === 'undefined' || api.allowRemoveAll) {
				extensionPoint.extensions.push(extension);
			}
			return this;
		};
		
		/**
		 * Calls the tracker's {onRemoveExtension} method, if it exists.
		 * <p>If a tracker does not yet exist, then any extensions removed with this method will not 
		 * show up in {onAddExtension}.</p>
		 * 
		 * @param {object} extension. This is passed to the tracker's {onRemoveExtension} method.
		 * Internally, a list of argument lists from {addExtension} calls is maintained. 
		 * The zeroth arg is compared with the extension parameter, and the arg list is removed.
		 */
		ExtensionPoint.prototype.removeExtension = function (extension) {
			var extensionPoint = this;
			// tell the tracker to remove the extension.
			if (extensionPoint.api !== null && extensionPoint.api.onRemoveExtension) {
				__apply_onRemoveExtension(extensionPoint, [extension]);
			}
			// do the book keeping internally.
			var extensions = extensionPoint.extensions;
			for (var i=0, max=extensions.length; i<max; i++) {
				if (extensions[i][0] === extension) {
					extensions.splice(i, 1);
					return;
				}
			}
			return this;
		};
		
		/**
		 * Tracks the additions (and optionally removals) of extensions.
		 * <p>At its simplest, this can be the method handler to an existing method in your application which needs extending. 
		 * This would effectively make {@link #addExtension} an alias to that method.
		 * <code>
		 *   extensions.registry.extensionPoint('my_widgets').track(_.bind(widgets, addWidget));
		 * </code>
		 * </p>
		 * 
		 * <p>At the end of the spectrum:
		 * 
		 * <code>
		 *   extensions.registry.extensionPoint('my_widgets').track({
		 *   	onAddExtension		: _.bind(widgets, addWidget),
		 *   	onRemoveExtension	: _.bind(widgets, removeWidget), 	// optional
		 *      allowRemoveAll		: true								// optional
		 *   });
		 * </code>
		 * </p>
		 * 
		 * <p>If existing extensions have been added without a tracker, then the tracker's {onAddExtension} method 
		 * is immediately called.</p>
		 * <p>If {onRemoveExtension} method is not present, or {allowRemoveAll} is {false}, then the internal 
		 * list of extensions will not be maintained. 
		 * If {onRemoveExtension} method is present AND {allowRemoveAll} is {true}, then the method is called for each 
		 * of the extensions in order if {link #removeAll} is called. 
		 * This is an optimization. By default, {allowRemoveAll} is {true}.</p>
		 * 
		 * @param {object} tracker
		 * @throws {Error} if the tracker is not a function, or an object that contains an {onAddExtension} method.
		 */
		ExtensionPoint.prototype.track = function (api) {
			var extensionPoint = this;
			if (typeof(api) === 'function') {
				api = {
					onAddExtension: api
				};
			} else if (typeof(api) !== 'object' || typeof(api.onAddExtension) !== 'function') {
				var err = {
					 name			: "ExtensionTrackerError",
					 extensionPoint	: this,
					 message		: "Object was passed with no onAddExtension funtion. No extensions for " + this.name + " will be processed"
				};
				// if the arg isn't an object with an onAddExtension method, then die.
				if (this.__registry.verbose === true) {
					console.log(err.message);
				}
				throw err;
			}
			
			extensionPoint.api = api;
			var extensions = extensionPoint.extensions;
			for (var i=0, max=extensions.length; i<max; i++) {
				var instance = extensions[i];
				
				var newInstance = __apply_onAddExtension(extensionPoint, instance);
				// this is so we can worry about lazy construction.
				if (instance !== newInstance) {
					extensions[i] = newInstance;
				}
			}
			
			// if we don't need to allow remove all, then we shouldn't worry about 
			// stashing the extensions internally.
			if (typeof(api.allowRemoveAll) !== 'undefined' && !api.allowRemoveAll) {
				extensionPoint.extensions = [];
			}
			return this;
		};
	
		/**
		 * Destroys this extension point, disconnecting it from the registry.
		 */
		ExtensionPoint.prototype.disconnect = function() {
			delete this.__registry.__extensionPoints[this.name];
			delete this["__registry"];
			delete this["api"];
			delete this["extensions"];
		};
		
		/**
		 * Removes all extensions added with {addExtenson}. 
		 * <p>If the tracker has an {onRemoveExtension} method, then this is called for each of 
		 * the extensions.</p>
		 * <p>There is a caveat:
		 * The tracker may have an {allowRemoveAll} property. If this is set and {false}, then the 
		 * tracker's {onRemoveExtension} will not be called. If not set, it {removeAll} will call {onRemoveExtension}. 
		 * This is a memory optimization.
		 * </p>
		 */
		ExtensionPoint.prototype.removeAll = function() {
			var extensionPoint = this;
			if (extensionPoint.api !== null && extensionPoint.api.onRemoveExtension) {
				var extensions = extensionPoint.extensions;
				for (var i=0, max=extensions.length; i<max; i++) {
					__apply_onRemoveExtension(extensionPoint, extensions[i]);
				}
			}
			extensionPoint.extensions = [];
		};
		
		/**
		 * @class
		 * An object that contains all extension points, and ergo, all extensions. 
		 * <code>
		 * 	var extensions = require('extensions');
		 * 	var widgets = extensions.registry.extensionPoint('my_widgets');
		 * 	widgets.addExtension(MyButtonWidget);
		 * </code>
		 * 
		 * <p>It is very much attended that the registry is available across multiple modules - 
		 * modules may contribute or consume extensions.</p>
		 * 
		 * <code>
		 * 	var extensions = require('extensions');
		 * 	var widgets = extensions.registry.extensionPoint('my_widgets');
		 * 
		 * 	widgets.track(_.bind(this, addWidget));
		 * </code>
		 * <p>Thus, this is a singleton object, available from the {exports} object of the module.</p>
		 */
		var Registry = function () {
			this.__extensionPoints = {};
			this.verbose = true;
		};	

		var __findExtensionPoint = function (reg, extension_point) {
			var extensionPoint = reg.__extensionPoints[extension_point];
			
			if (!extensionPoint) {
				extensionPoint = new ExtensionPoint(reg); 
				extensionPoint.name = extension_point;
				extensionPoint.extensions = [];
				extensionPoint.api = null;
				
				reg.__extensionPoints[extension_point] = extensionPoint;
			}
			return extensionPoint;
		};
		
		Registry.prototype.registerExtensionPoint = function (name, api) {
			var extensionPoint = __findExtensionPoint(this, name);
			return extensionPoint.track(api);
		};
		
		/**
		 * Find, or create an extension point of the given name.
		 * @param {string} extensionPointName. The name of the extension point.
		 */
		Registry.prototype.extensionPoint = function (extensionPointName) {
			return __findExtensionPoint(this, extensionPointName);
		};
		
		/**
		 * For later use, where lazy construction/configuration may be possible/useful.
		 */
		exports.objectFactory = function (extension) {
			// this is for later use, where lazy construction/configuration may be possible/useful.
			// di.injector.inject(extension[0]);
			return extension;
		};
		
		/*
		 * singleton object. 
		 */
		var singleton = new Registry();
		extension.registry = singleton;
	
		extension.extensionPoint = function() {
			return singleton.extensionPoint.apply(singleton, arguments);
		};
		
		
		extension.tracker = {};
		/**
		 * @class
		 * Convenience tracker for populating an array/list.
		 * <code>
		 *  // in the module contributing extensions.
		 *  extensions.registry.extensionPoint('my_widgets').addExtension(ButtonWidget);
		 *  
		 *  // in the module using the extensions.
		 *  var list = []; 
		 *  var tracker = new extensions.tracker.ExtensionsList(list);
		 * 	extensions.registry.extensionPoint('my_widgets').track(tracker);
		 * 
		 *  // list contains [MyWidget];
		 *  assert.ok(list.length > 0);
		 * </code>
		 * This tracker sets {allowRemoveAll} to {false}. {@see ExtensionPoint#removeAll}.
		 */
		extension.tracker.ExtensionsList = function (list) {
			
			// default is true.
			this.allowRemoveAll = false;

			this.onAddExtension = function (item) {
				if (arguments.length == 1) {
					list.push(item);
				} else {
					list.push(arguments);
				}
			};
			
			this.onRemoveExtension = function (item) {
				for (var i=0, max=list.length; i<max; i++) {
					var stored = list[i];
					if (stored.hasOwnProperty(0) && !item.hasOwnProperty(0)) {
						stored = stored[0];
					}
					if (stored === item) {
						list.splice(i, 1);
						return;
					}
				}
			};
		}
		
			
		
		
		/**
		 * @class
		 * Convenience tracker for populating an dictionary/map/object.
		 * <code>
		 *  // in the module contributing extensions.
		 *  extensions.registry.extensionPoint('my_widgets').addExtension("button", ButtonWidget);
		 *  
		 *  // in the module using the extensions.
		 *  var map = {}; 
		 *  var tracker = new extensions.tracker.ExtensionsObject(map);
		 * 	extensions.registry.extensionPoint('my_widgets').track(tracker);
		 * 
		 *  //map contains {button: ButtonWidget};
		 *  assert.ok(typeof map.button !== 'undefined');
		 * 
		 * </code>
		 * This tracker sets {allowRemoveAll} to {false}. {@see ExtensionPoint#removeAll}.
		 */
		extension.tracker.ExtensionsObject = function(obj, optional_keyname) {
			// TODO make this a prototype based class.
			var __keyValue = function(key, value) {
				if (typeof(value) === 'undefined' && typeof(optional_keyname) !== 'undefined') {
					value = key;
					key = value[optional_keyname];
				}
				return [key, value];
			};
			this.onAddExtension = function(key, value) {
				var kv = __keyValue(key, value);
				key = kv[0];
				value = kv[1];
				if (typeof(key) !== 'undefined' && typeof(value) !== 'undefined') {
					obj[key] = value;
				}
			};
			this.onRemoveExtension = function(key) {
				var kv = __keyValue(key);
				key = kv[0];
				delete obj[key];
			};
			// default is true, but memory optimization
			this.allowRemoveAll = false;
		};
	};
	
	if (typeof(modules) !== 'undefined' && typeof(window) !== 'undefined') {
		// so we may be in a browser context, and want to delay construction until 
		// we're required.
		modules.extensions = module;
	} else {
		// otherwise do it. Now. 
		module(require, exports);
	}	
})();