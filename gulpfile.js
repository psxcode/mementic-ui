"use strict";

var gulp = require('gulp');
var path = require('path');

gulp.task('default', function() {
	return require('./tasks/build')({
		deps: ['theme-material', 'theme-test']
	}).streamCss().pipe(gulp.dest('./public'));
});