var gulp = require('gulp');
var path = require('path');

gulp.task('default', function() {
	require('./tasks/build')
		.streamCss({deps: 'material'})
		.pipe(gulp.dest('build/'));
});