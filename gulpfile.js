"use strict";

var gulp = require('gulp');
var path = require('path');

gulp.task('default', function() {
	return require('./tasks/build')({
		deps: [{'mementic': 'label'}]
	}).streamCss().pipe(gulp.dest('./build'));
});