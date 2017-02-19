"use strict";

var gulp = require('gulp'),
	sass = require('gulp-sass'),
	clean = require('gulp-clean'),
	concat = require('gulp-concat'),
	rename = require('gulp-rename'),
	templates = require('gulp-angular-templatecache'),
	inject = require('gulp-inject'),
	merge = require('ordered-merge-stream');

// Require Mem-UI
var ui = require('./index')({
	themeDir: 'client',
	output: {
		path: '',
		files: {
			'preload.css': {
				'mementic': ['button.default']
			},
			'style.css': {
				'mementic': ['button']
			}
		}
	}
});

gulp.task('start', function () {

	require('browser-sync').create().init({
		port: 3000,
		server: {
			baseDir: './static'
		},
		files: ['./static/*']
	});

	// scss
	gulp.watch(['./themes/**/*', 'client/css/**/*'], ['css']);

	// js
	gulp.watch(['./client/js/**/*', './client/views/**/*'], ['js']);
});

gulp.task('build', function (done) {
	require('run-sequence')('clean', 'build', 'index.html', done);
});

gulp.task('clean', function () {
	return gulp.src(['./static/**/*', '!./static/favicon.ico'], {read: false}).pipe(clean());
});

gulp.task('build', function () {
	return install(merge([streamJs(), streamCss(), streamStatic()]));
});

gulp.task('index.html', function () {
	return install(gulp.src('./client/views/index.html')
		.pipe(inject(gulp.src(['./static/*.css', './static/*.js'], {read: false}), {ignorePath: 'static'})));
});

function install(stream) {
	return stream.pipe(gulp.dest('./static'));
}

function streamJs() {
	return merge([
		gulp.src([
			'./client/lib/jquery/dist/jquery.js',
			'./client/lib/angular/angular.js',
			'./client/lib/angular-ui-router/release/angular-ui-router.js',
			'./client/js/**/*.js'
		]),
		gulp.src('./client/views/templates/**/*.html').pipe(templates('templates.js', {module: 'mem'}))
	]).pipe(concat('app.js'));
}

function streamCss() {
	return ui.streamCss();
}

function streamStatic() {
	return ui.streamStatic().pipe(gulp.dest('./public'));
}
