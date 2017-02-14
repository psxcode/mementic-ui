"use strict";

var gulp = require('gulp'),
	inject = require('gulp-inject'),
	injectString = require('gulp-inject-string'),
	sass = require('gulp-sass'),
	cleanCss = require('gulp-clean-css'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	replace = require('gulp-replace');

var config = require('./config');
var merge = require('ordered-merge-stream');
var _ = require('lodash');

module.exports = function (conf) {
	exports.config = _.assign(Object.create(null), conf);
	return exports;
};

exports.streamCss = streamCss;
exports.streamStatic = streamStatic;
exports.install = install;

function streamCss() {
	var streams = [];

	config.getAllThemesModules(collectStreams);

	return merge(streams)
		.pipe(concat(config.paths.cssFilename))
		.pipe(injectString.prepend('@charset "UTF-8";\n'))
		;

	function collectStreams(moduleName, modulePathInTheme) {
		streams.push(streamModule(moduleName, modulePathInTheme));
	}

	function streamModule(moduleName, modulePathInTheme) {
		return gulp.src(config.paths.sassModuleFilepath)
			.pipe(inject(gulp.src(config.getModulePaths(moduleName, modulePathInTheme), {read: false}), config.injectOpts))
			.pipe(sass()).pipe(replace(/@charset.*/g, ''))
			.pipe(cleanCss({keepBreaks: true, advanced: true}))
			;
	}
}

function streamStatic() {
	return gulp.src(config.getPublicPaths());
}

function install(path) {
	return merge([streamCss(), streamStatic()]).pipe(gulp.dest(path));
}
