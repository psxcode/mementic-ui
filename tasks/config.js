"use strict";

var path = require('path');
var fsxu = require('fsxu');

//Paths
var paths = null;
(function () {
	var rootdir = fsxu.findUpSync('package.json', __dirname);
	var srcdir = path.join(rootdir, 'src');
	var thmdir = path.join(rootdir, 'themes');
	paths = {
		root: rootdir,
		themes: thmdir,
		source: srcdir,
		sassMainFile: path.join(srcdir, 'main.scss')
	};
}());

//InjectConfig
var injectConfig = null;
(function () {
	injectConfig = {
		relative: false,
		starttag: '//begin-inject',
		endtag: '//end-inject',
		transform: transform
	};

	function transform(filepath) {
		console.log('inject path: ', filepath);
		return '@import ".' + filepath + '";';
	}
}());

//User Config (set in initConfig)
var userConfig = {
	site: '',
	theme: '',
	output: 'build/'
};

//Exports
(function () {
	module.exports = function initConfig(config) {
		if(config) userConfig = config;
	};

	module.exports.paths = paths;
	module.exports.userCfg = userConfig;
	module.exports.getInjectPaths = srcPaths;
	module.exports.injectOpts = injectConfig;
}());


function srcPaths() {
	var themePaths = resolveInjectThemePaths();

	return globalsVars();

	function globalsVars() {
		return filePaths('globals', '_vars.scss');
	}

	function filePaths(dirname, filename) {
		var paths = [];
		for (var i = 0; i < themePaths.length; ++i) {
			var src = path.join(themePaths[i], dirname, filename);
			if (fsxu.isFileSync(src)) {
				paths.push(src);
			}
		}

		return paths;
	}
}

function resolveInjectThemePaths() {
	var nextPath = resolveUserThemePath();

	var themePaths = [];
	//last theme is user theme
	if (nextPath) themePaths.push(nextPath);

	while (nextPath = resolveThemeDependencyPath(nextPath)) {
		//adding dependencies to front
		if (nextPath) themePaths.unshift(nextPath);
	}

	//add source path as first theme
	themePaths.unshift(paths.source);

	return themePaths;

	function resolveUserThemePath() {
		if (userConfig.site && typeof userConfig.site === 'string' && fsxu.isFileSync(path.join(userConfig.site, 'theme.json'))) {
			return userConfig.site;
		} else if (userConfig.theme && typeof userConfig.theme === 'string' && fsxu.isFileSync(path.join(userConfig.theme, 'theme.json'))) {
			return path.join(paths.themes, userConfig.theme);
		}
		return null;
	}

	function resolveThemeDependencyPath(themePath) {
		var themeConfig = null;
		if (themePath) {
			themeConfig = fsxu.readJsonSync(path.join(themePath, 'theme.json'));
		}

		return themeConfig && themeConfig.theme ? path.join(paths.themes, themeConfig.theme) : null;
	}
}