"use strict";

var gulp = require('gulp');
var inject = require('gulp-inject');
var sass = require('gulp-sass');
var cleanCss = require('gulp-clean-css');
var merge = require('ordered-merge-stream');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var config = require('./config');
var _ = require('lodash');

exports.build = build;

function build(userConfig) {
	config(userConfig);

	return merge([streamCss(), streamPublicFiles()]);

	function streamCss() {
		var streams = [];

		_.forEach(config.modules, function (obj) {
			var path = obj.path;
			_.forEach(obj.names, function (name) {
				streams.push(streamModule(name, path));
			});
		});

		return merge(streams).pipe(concat(config.paths.cssFilename));
	}

	function streamPublicFiles() {
		return gulp.src(config.getPublicPaths());
	}

	function streamModule(moduleName, modulePathInTheme) {
		return gulp.src(config.paths.sassModuleFilepath)
			.pipe(inject(gulp.src(config.getModulePaths(moduleName, modulePathInTheme), {read: false}), config.injectOpts))
			.pipe(sass())
			//.pipe(cleanCss({keepBreaks: true, advanced: false}))
			;
	}
}

