"use strict";

var path = require('path');
var fsxu = require('fsxu');
var _ = require('lodash');

var rootdir = fsxu.findUpSync('package.json', __dirname);
var srcdir = path.join(rootdir, 'themes');
var themeDirsProp = require('./helpers').prop.bind(null, ['themeDir', 'themeDirs', 'themedir', 'themedirs']);

var constConfig = {
	rootdir: rootdir,
	srcdir: srcdir,
	sassModuleFilepath: path.join(srcdir, 'module.scss'),
	themeConfigFilenames: ['mem.js', 'mem.json'],
	themeConfigExportKeys: ['export', 'exports'],
	themeGlobalsDirname: 'globals',
	themeGlobalsComponentNames: ['vars', 'fonts', 'reset']
};

var defaultConfig = {

	// gulp-inject options for module.scss injection
	injectOpts: {
		relative: false,
		starttag: '//begin-inject',
		endtag: '//end-inject',
		transform: function (filepath) {
			console.log('inject path: ', filepath);
			return '@import ".' + filepath + '";';
		}
	}
};

var config = configure(defaultConfig);

module.exports = configure;

function configure(conf) {

	if (!_.isObject(conf)) return config;

	// get user dependency paths
	var userThemeDirs = themeDirsProp(conf);
	if (userThemeDirs == null) userThemeDirs = [];
	if (!_.isArray(userThemeDirs)) userThemeDirs = [userThemeDirs];
	userThemeDirs.unshift(srcdir);

	// output
	var output = conf.hasOwnProperty('output') ? conf.output : {};

	return config = _.assign(
		Object.create(null),
		defaultConfig, {
			themeDirs: userThemeDirs,
			output: output
		}, constConfig
	);
}

