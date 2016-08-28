"use strict";

var gulp = require('gulp');
var inject = require('gulp-inject');
var sass = require('gulp-sass');
var cleanCss = require('gulp-clean-css');
var merge = require('ordered-merge-stream');
var concat = require('gulp-concat');
var config = require('./config');
var _ = require('lodash');

exports.streamCss = streamCss;

function streamCss(userConfig) {
	config(userConfig);

	var streams = [];

	_.forEach(config.modules, function (obj) {
		var path = obj.path;
		_.forEach(obj.names, function (name) {
			streams.push(streamModule(name, path));
		});
	});

	return merge(streams).pipe(concat('style.css'));
}

function streamModule(moduleName, modulePathInTheme) {
	return gulp.src(config.paths.sassModuleFilepath)
		.pipe(inject(gulp.src(config.getModulePaths(moduleName, modulePathInTheme), {read: false}), config.injectOpts))
		.pipe(sass())
		//.pipe(cleanCss({keepBreaks: true, advanced: false}))
	;
}