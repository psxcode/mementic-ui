var gulp = require('gulp');
var path = require('path');

gulp.task('default', function() {
	require('./tasks/build').streamCss({site: path.resolve('/site/')})
		.pipe(gulp.dest('build/'));
});