var sys = require('sys');

function runSuite(testThese) {
	for (var i=0; i<testThese.length; i++) {
		var tests = require(testThese[i]);
		runTestCase(testThese[i], tests);
	}	
}

function runTestCase(testName, tests) {
	sys.puts("Testing  " + testName);
	
	var setupMethod = tests.setup;
	var numTests = 0;
	var numFailures = 0;
	var numSucceed = 0;
	for (var name in tests) {
		if (/^test/.exec(name)) {
			try {
				numTests ++;
				if (typeof setupMethod === 'function') {
					setupMethod();
				}	
				if (typeof tests[name] === 'function') {
						tests[name]();
				}
				numSucceed++;
			} catch (err) {
				numFailures ++;
				if (typeof err.stack !== 'undefined') {
					sys.debug(err.stack);
				} else {
					sys.debug(sys.inspect(err));
				}	
			}
		}
		
	}
	var numSucceed = 
	sys.puts("Finished " + testName + ": passed " + numSucceed + "/" + numTests + " (" +(100 * numSucceed / numTests)+ "%)");
	sys.puts("================================");
}

exports.runSuite = runSuite;
