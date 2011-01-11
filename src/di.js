
(function () {
	var moduleName = "di";
	var module = function (require, exports) {
		
		/**
		 * Injector is an object which takes care of wiring objects together.
		 *  
		 * <p>This is dirt simple dependency injection, based (largely) around property names.</p>
		 * 
		 * <p>The injector contains a map of {id}s to {objectFactories}.</p>
		 * <p>These object factories are used to serve new instances of classes, singletons or returns from a closure.</p>
		 * <p>These objects can be used to set properties of the same name as the id, or property names 
		 * found in a {propertyName} to {id} object optionally contained at {object.inject}.</p> 
		 * <p>Properties with non-null values are not overwritten. 
		 * @class
		 */
		var Injector = function() {
			this.reset();
		};
		
		/**
		 * Clears all object factories, except "injector".
		 */
		Injector.prototype.reset = function () {
			this.__objectFactories = {};
			this.setSingleton("injector", this);
		}
		
		/**
		 * @param {string} propertyName The id of the singleton.
		 * @param {object} singleton The singleton which will populate properties of this name.
		 */
		Injector.prototype.setSingleton = function (id, singleton) {
			this.setFactory(id, function() { return singleton; });
		}
		
		/**
		 * @param {string} id The name of the object.
		 * @param {Function} factory The function that will be used to generate the object. 
		 * 
		 * <p>The signature for the factoryFunction is factory({object}). This object is the object that 
		 * is being injected.</p>
		 */
		Injector.prototype.setFactory = function (id, factoryFunction) {
			// should probably check if this factory is a function
			this.__objectFactories[id] = factoryFunction;
		}
		
		/**
		 * @param {string} id the id of the class.
		 * @param {Function} the constructor for the class which will give instances of this object.
		 */
		Injector.prototype.setClass = function (id, constructorFunction) {
			this.setFactory(id, function() {
				return new constructorFunction();
			});
		}
		
		/**
		 * @param {string} id The id of the objectFactory to be aliased.
		 * @param Vararg {string} aliases One or more aliases to be made. 
		 */
		Injector.prototype.makeAlias = function () {
			if (arguments.length < 2) {
				return;
			}
			var value = this.__objectFactories[arguments[0]];
			if (typeof(value) === 'undefined') {
				return;
			}
			for (var i=1, max=arguments.length; i<max; i++) {
				var alias = arguments[i];
				this.__objectFactories[alias] = value;
			}
		}
		
		/**
		 * @param {string} id The id of the object which should be found or created.
		 * @param {object} parent (optional) Object which will be injected with the object returned from this. 
		 * This parameter will be passed to the object factory which may want to use it to select the object to serve.
		 */
		Injector.prototype.findInstance = function (id, parent) {
			var creator = this.__objectFactories[id];
			var object;
			if (typeof(creator) === "function") {
				object = creator(parent);
			} 
			
			if (typeof(object) !== "undefined") {
				return this.inject(object);
			}
		
			return null;
		};
		
		/**
		 * Sets properties set to {null} with objects from the injector.
		 * 
		 * @param {object} the object to be configured.  
		 */
		Injector.prototype.inject = function (object) {
			if (object === null) {
				return null;
			}
			// unsure of the wisdom here:
			// this is looking up the object based on the value of  
			// the param, e.g. lazy construction.
			if (typeof object === 'string') {
				var newInstance = this.findInstance(object);
				if (newInstance !== null) {
					object = newInstance;
				} else {
					return object;
				}
			}
			
			var bindings = object.inject;
			if (typeof(bindings) === 'object') {
				for (alias in bindings) {
					var propertyName = bindings[alias];
					if (typeof object[alias] === 'undefined' || object[alias] === null) {
						object[alias] = this.findInstance(propertyName, object);
					}
				}
			}
			for (propertyName in object) {
				if (object[propertyName] === null) {
					object[propertyName] = this.findInstance(propertyName, object);
				}
			}
			
			return object;
		}

		exports.injector = new Injector();
		
	};
	
	
	if (typeof(modules) !== 'undefined') {
		// so we may be in a browser context, and want to delay construction until we're required.
		modules[moduleName] = module;
	} else {
		// otherwise do it. Now. 
		module(require, exports);
	}	
})();