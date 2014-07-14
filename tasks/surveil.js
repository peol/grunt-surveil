"use strict";

module.exports = function( grunt ) {
	var initialized = false;
	var delayedExecution = null;
	var pendingTargets = Object.create( null );
	var defaultForceFlag = grunt.option( "force" );
	var doneFn,
		options,
		init;

	/**
	* Helper to retrieve grunt configuration for surveil targets.
	* @internal
	*
	* @param {String} [target] The target name to get the configuration for
	* @returns {Object} A configuration for a surveil target. If `target` was
	*                   omitted, it'll return the surveil configuration.
	*/
	function getConfig( target ) {
		var key = "surveil" + (target ? "." + target : "");
		return grunt.config.get( key );
	}

	/**
	* Queue a file to a specific target. Creates the queue if it doesn't exist.
	* @internal
	*
	* @param {String} file The file to queue (absolute path)
	* @param {String} target The name of the target to invoke for this file
	*/
	function addFileToPendingTarget( file, target ) {
		var queue = pendingTargets[target] = pendingTargets[target] || [];
		queue.push( file );
	}

	/**
	* Builds a task list out of all currently pending targets' tasks.
	* @internal
	*
	* @returns {Array} An array of tasks (strings)
	*/
	function buildTaskList() {
		var tasks = [];

		Object.keys( pendingTargets ).forEach( function( target ) {
			var cfg = getConfig( target );
			var cfgTasks = cfg.tasks;

			if ( cfg.prepare ) {
				cfgTasks = cfg.tasks.filter( function( task ) {
					return cfg.prepare( pendingTargets[target], task, target ) !== false;
				} );
			}

			tasks.push.apply( tasks, cfgTasks );
		} );

		return tasks;
	}

	/**
	* Executes the current pending queue of targets.
	* @internal
	*/
	function executePendingTargets() {
		doneFn();
		grunt.option( "force", true );

		grunt.task.run( buildTaskList() );

		pendingTargets = Object.create( null );
		grunt.task.run( "surveil" );
	}

	/**
	* Handle a added/changed/removed file event for a specific target.
	* @internal
	*
	* @param {String} file The file that changed (absolute path)
	* @param {String} target The target the change belongs to
	* @param {Date} init A timestamp of when the surveil task was last initialized
	*/
	function queueFile( file, target, init ) {
		var cfg = getConfig( target );
		var diff = +new Date() - +init;

		if ( cfg.rewritesWatchedFiles && diff < options.rewriteThreshold ) {
			// this task is flagged as something that can
			// cause rewrites on watched files. this means
			// that we'll trigger multiple times on those files
			grunt.verbose.writeln( "Skipped '%s' due to rewrite flag", file );
			return;
		}

		clearTimeout( delayedExecution );
		addFileToPendingTarget( file, target );
		delayedExecution = setTimeout( executePendingTargets, options.delay );
	}

	/**
	* Gets a list of surveil targets the surveil task should utilize.
	* @internal
	*
	* @param {String} [nameArgs] The grunt task `this.nameArgs`
	* @returns {Array} An array of targets surveil should utilize. If
	*                  `nameArgs` is omitted, all surveil targets will
	*                  be returned.
	*/
	function getTargets( nameArgs ) {
		var definedTargets = Object.keys( getConfig() );
		var target = nameArgs.split( ":" )[1];

		if ( target ) {
			if ( definedTargets.indexOf( target ) === -1 ) {
				throw new Error( "The supplied target was not found: '" + target + "'" );
			}
			target = [target];
		} else {
			target = definedTargets;
		}

		return target;
	}

	grunt.registerTask( "surveil", require( "../package.json" ).description, function() {
		grunt.option( "force", defaultForceFlag );
		init = new Date();
		doneFn = this.async();

		if ( initialized ) {
			grunt.verbose.writeln( "Watcher(s) re-attached..." );
			return;
		}

		initialized = true;

		// sigint-hook helps with ctrl/cmd+c, by default, this keyboard combo works
		// on OSX/Linux, but not on Windows...:
		var sigint = require( "sigint-hook" )( {
			eventOnHookOnly: true
		} );
		sigint.on( "SIGINT", function() {
			grunt.task.clearQueue();
			doneFn();
		} );

		// default options for the surveil task:
		options = this.options( {
			emitOnAllTargets: false,
			delay: 0,
			rewriteThreshold: 100
		} );

		var Gaze = require( "gaze" ).Gaze;
		var targets = getTargets( this.nameArgs );

		targets.forEach( function( target ) {
			var cfg = getConfig( target );
			var gazer = new Gaze( cfg.src );

			gazer.on( "ready", function() {
				grunt.verbose.writeln( "Watcher created for target '%s'...", target );

				if ( !options.emitOnAllTargets ) {
					// monkey patch gazer's default behavior of emitting
					// changes to all instances to only trigger on this
					// specific watcher:
					gazer._emitAll = gazer.emit;
				}

				gazer.on( "error", function( error ) {
					throw error;
				} );

				gazer.on( "all", function( evt, filepath ) {
					queueFile( filepath, target, init );
				} );
			} );
		} );
	} );
};
