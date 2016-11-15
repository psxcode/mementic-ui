"use strict";

var gulp = require('gulp');
var sass = require('gulp-sass');
var cleanCss = require('gulp-clean-css');
var merge = require('ordered-merge-stream');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var templates = require('gulp-angular-templatecache');
var inject = require('gulp-inject');
var path = require('path');
var clean = require('gulp-clean');

// Require Mem-UI
var ui = require('./index');

gulp.task('serve', function () {
	var bs = require('browser-sync').create();

	bs.init({
		port: 3000,
		server: {
			baseDir: './public'
		},
		files: ['./public/*']
	});

	// scss
	gulp.watch(['./themes/**/*.*', 'client/site/**/*'], ['css']);

	// js
	gulp.watch(['./client/js/**/*', './client/views/**/*'], ['js']);
});

gulp.task('clean', function () {
	return gulp.src(['./public/**/*', '!./public/favicon.ico'], {read: false})
		.pipe(clean());
});

gulp.task('build-install', ['css', 'js', 'clean'], function () {

	//inject minified files into index.html
	var indexHtmlStream = gulp.src('./client/views/index.html')
		.pipe(inject(gulp.src(['./public/*.css', './public/*.js'], {read: false}), {ignorePath: 'public'}));

	//stream public files
	var uiPublicStream = ui.streamPublic();

	//write everything into public
	merge([indexHtmlStream, uiPublicStream]).pipe(gulp.dest('./public'));
});

gulp.task('js', function () {
	var js = gulp.src([
		'./client/lib/jquery/dist/jquery.js',
		'./client/lib/angular/angular.js',
		'./client/lib/angular-ui-router/release/angular-ui-router.js',
		'./client/js/**/*.js'
	]);

	var tmps = gulp.src('./client/views/templates/**/*.html')
		.pipe(templates('tmps.js', {module: 'mean'}));

	return merge([js, tmps])
		.pipe(concat('app.js'))
		.pipe(gulp.dest('./public'));
});

gulp.task('css', function () {

	if (!ui.isConfigured()) {
		ui({deps: ['client/site']});
	}

	return ui.streamCss().pipe(gulp.dest('./public'));
});