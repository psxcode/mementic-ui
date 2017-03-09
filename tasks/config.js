"use strict";

var path = require('path');
var fsxu = require('fsxu');
var _ = require('lodash');

var rootdir = fsxu.findUpSync('package.json', __dirname);
var srcdir = path.join(rootdir, 'themes');
var moduleDirsProp = require('./helpers').prop.bind(null, ['from']);

var constConfig = {
	rootdir: rootdir,
	srcdir: srcdir,
	sassModuleFilepath: path.join(srcdir, 'module.scss'),
	moduleConfigFilenames: ['mem.js', 'mem.json'],
	moduleConfigExportKeys: ['export', 'exports'],
	moduleGlobalsDirname: 'globals',
	moduleGlobalsComponentNames: ['vars', 'fonts', 'reset']
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
	var userModuleDirs = moduleDirsProp(conf);
	if (userModuleDirs == null) userModuleDirs = [];
	if (!_.isArray(userModuleDirs)) userModuleDirs = [userModuleDirs];
	userModuleDirs.unshift(srcdir);

	// output
	var output = conf.hasOwnProperty('output') ? conf.output : {};

	return config = _.assign(
		Object.create(null),
		defaultConfig, {
			moduleDirs: userModuleDirs,
			output: output
		}, constConfig
	);
}

