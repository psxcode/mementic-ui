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

module.exports = function (userConfig) {
	config(userConfig);

	return module.exports;
};

module.exports.streamCss = streamCss;
module.exports.streamPublic = streamPublic;
module.exports.isConfigured = config.isConfigured;

function streamCss() {
	var streams = [];

	config.getAllThemesModules(collectStreams);

	return merge(streams).pipe(concat(config.paths.cssFilename));

	function collectStreams(moduleName, modulePathInTheme) {
		streams.push(streamModule(moduleName, modulePathInTheme));
	}

	function streamModule(moduleName, modulePathInTheme) {
		return gulp.src(config.paths.sassModuleFilepath)
				.pipe(inject(gulp.src(config.getModulePaths(moduleName, modulePathInTheme), {read: false}), config.injectOpts))
				.pipe(sass())
			//.pipe(cleanCss({keepBreaks: true, advanced: false}))
			;
	}
}

function streamPublic() {
	return gulp.src(config.getPublicPaths());
}

