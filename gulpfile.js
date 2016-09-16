"use strict";

var gulp = require('gulp');
var path = require('path');

gulp.task('default', function() {
	return require('./tasks/build')({
		depsDir: null,
		deps: [{'mem-elements': 'segment'}],
		ignoreThemeDeps: false
	}).streamCss().pipe(gulp.dest('./build'));
});