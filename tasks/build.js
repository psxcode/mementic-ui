"use strict";

var gulp = require('gulp');
var inject = require('gulp-inject');
var sass = require('gulp-sass');
var config = require('./config');

exports.streamCss = streamCss;

function streamCss(userConfig) {
	config(userConfig);

	return gulp.src(config.paths.sassMainFilepath)
		.pipe(inject(gulp.src(config.getInjectPaths(), {read: false}), config.injectOpts))
		.pipe(sass());
}