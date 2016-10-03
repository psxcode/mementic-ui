"use strict";

var gulp = require('gulp');
var path = require('path');


function ui() {
	var result = require('./tasks/build');

	if (!result.isConfigured()) {
		result({
			deps: ['theme-test']
		});
	}

	return result;
}

gulp.task('default', function () {
	return ui().streamCss().pipe(gulp.dest('./public'));
});

gulp.task('install', function () {
	return ui().streamPublic().pipe(gulp.dest('./public'));
});