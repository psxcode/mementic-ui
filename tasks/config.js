"use strict";

var path = require('path');
var fsxu = require('fsxu');
var _ = require('lodash');

var themeDirKeys = ['themeDir', 'themeDirs', 'themedir', 'themedirs'];
var rootdir = fsxu.findUpSync('package.json', __dirname);
var srcdir = path.join(rootdir, 'themes');

var constConfig = {
	rootdir: rootdir,
	srcdir: srcdir,
	sassModuleFilepath: path.join(srcdir, 'module.scss'),
	themeConfigFilename: 'mem.js',
	globalsName: 'globals'
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

module.exports = config;
config();

function config(conf) {

	var c = {
		themeDirs: [srcdir]
	};

	// get user dependency paths
	var userThemeDirs = getPropertyByKeys(conf, themeDirKeys);
	if (_.isArray(userThemeDirs)) {
		_.forEach(userThemeDirs, pushUniqueThemeDir);
	} else if (_.isString(userThemeDirs) && userThemeDirs.length > 0) {
		pushUniqueThemeDir(userThemeDirs);
	}

	return _.assign(module.exports, defaultConfig, c, constConfig);

	function pushUniqueThemeDir(dir) {
		var dirAbs = path.resolve(dir);
		if (!fsxu.isDirSync(dirAbs)) {
			throw new Error('Theme Dir is invalid: ' + dir + '. resolved to: ' + dirAbs);
		}

		if (_.indexOf(c.themeDirs, dir) < 0) {
			c.themeDirs.push(dirAbs);
		}
	}
}

function getPropertyByKeys(obj, keys) {
	for (var i = 0; i < keys.length; ++i) {
		if (obj.hasOwnProperty(keys[i])) {
			return obj[keys[i]];
		}
	}
}

