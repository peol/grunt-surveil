"use strict";

module.exports = function( grunt ) {
	grunt.initConfig( {
		jsFiles: ["gruntfile.js", "tasks/**/*.js"],
		eslint: {
			options: {
				config: "eslint.json"
			},
			src: "<%= jsFiles %>"
		},
		esformatter: {
			options: require( "./esformatter.json" ),
			src: "<%= jsFiles %>"
		},
		surveil: {
			jsFormatting: {
				rewritesWatchedFiles: true,
				src: "<%= jsFiles %>",
				tasks: ["eslint:partial", "esformatter:partial"],
				prepare: function( files, task ) {
					if ( task === "eslint:partial" ) {
						grunt.config( "eslint.partial", files );
					} else if ( task === "esformatter:partial" ) {
						grunt.config( "esformatter.partial", files );
					}
				}
			}
		}
	} );

	grunt.loadNpmTasks( "grunt-esformatter" );
	grunt.loadNpmTasks( "grunt-eslint" );
	grunt.loadTasks( "tasks" );
};
