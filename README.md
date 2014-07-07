# grunt-surveil

## Description
This grunt task enables you to trigger tasks whenever files are added, changed, or removed. It's very much like [grunt-contrib-watch](https://github.com/gruntjs/grunt-contrib-watch) but with a few different design choices:

* surveil enables you to control how your tasks gets invoked, that is, before the tasks are being run you have a chance to modify grunt configurations to enable running tasks on only changed files. You can even tell `grunt-surveil` to skip a task at runtime depending on which file changed.
* It also sets up its file watchers once, and will then re-use those until grunt is exited. This comes with a few got-cha's that you can read about below, but ultimately means that performance and responsiveness increases a lot when running for a long time and/or using common tasks.

## Never-ending file watchers
If you watch a lot of files/directories, triggering tasks can be a bit pain when using most other watchers. Re-watching thousands of nodes takes a while, even on an SSD.

This also causes responsiveness of the watch task to go down noticeably (if files are changed during triggered tasks, you won't retroactively get these file changes after they're done and have to "touch" the files once more to trigger another round.)

This is what `grunt-surveil` has been designed to mitigate.

## Usage

### Install
`grunt-surveil` is not yet on npm. You have to manually install the task to run it. More info to come.

### Configuration
Like `grunt-contrib-watch`, `grunt-surveil` is a single-target grunt task that uses multi-task configuration.

#### Parameters (global)
###### `delay: 100`
The number of milliseconds to delay executing tasks when files change. This can be good to adjust if you want to do more "bulk runs."

##### `emitOnAllTargets: false`
Whether to trigger all targets when files change. The default behavior of [gaze](https://github.com/shama/gaze) is to emit file changes to _all_ watch instances. By default in `grunt-surveil`, this behavior is disabled to enable more granular execution of tasks but might not play ball with every task out there.

##### `rewriteThreshold: 100`
The number of milliseconds that files are ignored _after_ tasks has been run. It is only used when a task has the `rewritesWatchedFiles` flag enabled.

#### Parameters (per target)
###### `src: "<%= foo.bar %>/**/baz/*.js"`
The source files to watch on. Can be any pattern that is supported by grunt.

##### `prepare: function(changedFiles, task)`
This callback gets invoked _once_ for every task in the task list. If you decide that the current task doesn't need to be executed, returning `false` from this callback will make `grunt-surveil` to ignore that task.

##### `tasks: ["foo", "bar:baz"]`
The list of grunt tasks to execute when `src` files change. The tasks will be executed in order.

##### `rewritesWatchedFiles: false`
This flag can be used on targets that you know will overwrite watched files. Due to re-using file watchers under task executions, these watches will trigger changes on files that the executed tasks changes. This prohibits `grunt-surveil` from triggering during that time.

#### Examples
A typical configuration to might look something like this:

```
grunt.initConfig( {
	surveil: {
		javascript: {
			src: ["gruntfile.js", "lib/**/*.js"],
			prepare: function( changedFiles, task ) {
				grunt.config( "eslint.partial", changedFiles );
			},
			tasks: ["eslint:partial"]
		}
	}
} );
```

The above configuration will only run the `eslint:partial` task with the changed files, instead of running on potentially thousands of watched files.

Here's another example, using the `rewritesWatchedFiles` flag. This flag is used to discard file changes while a task is being run, to work around triggering the task double or indefinitely:

```
grunt.initConfig( {
	surveil: {
		javascript: {
			rewritesWatchedFiles: true,
			src: ["gruntfile.js", "lib/**/*.js"],
			prepare: function( changedFiles, task ) {
				grunt.config( "esformatter.partial", changedFiles );
			},
			tasks: ["esformatter:partial"]
		}
	}
} );
```

# License
This project uses MIT. See `LICENSE` file for additional information.