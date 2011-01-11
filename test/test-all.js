var testThese = ['di_test', 'extension_test'];


// =======================================
require.paths.unshift(".");
require.paths.unshift("../src");

var testRunner = require('test-runner');

testRunner.runSuite(testThese);

