"use strict";

var gulp = require('gulp');
var path = require('path');

gulp.task('default', function() {
	return require('./tasks/build')
		.build({
			depsDir: null,
			deps: []
		})
		.pipe(gulp.dest('build/'));
});