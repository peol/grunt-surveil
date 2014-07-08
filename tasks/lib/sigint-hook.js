var sigintHooked = false;

module.exports = function sigintHook( fn ) {
	if ( sigintHooked ) {
		return;
	}
	sigintHooked = true;
	// ctrl+c should stop this task and quit grunt gracefully
	// (process.on("SIGINT", fn) doesn't behave correctly on Windows):
	var rl = require( "readline" ).createInterface( {
		input: process.stdin,
		output: process.stdout
	} );
	rl.on( "SIGINT", function() {
		fn();
		rl.close();
	} );
};