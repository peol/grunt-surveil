module.exports = function( grunt ) {
	grunt.initConfig( {
		esformatter: {
			options: require( "./esformatter.json" ),
			src: ["gruntfile.js", "tasks/**/*.js"]
		},
		surveil: {
			js: {
				src: "<%= esformatter.src %>",
				rewritesWatchedFiles: true,
				tasks: ["esformatter:partial"],
				prepare: function( files, task ) {
					grunt.config( "esformatter.partial", files );
				}
			}
		}
	} );

	grunt.loadNpmTasks( "grunt-esformatter" );
	grunt.loadTasks( "tasks" );
};