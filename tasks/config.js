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
		sassMainFilepath: path.join(srcdir, 'main.scss'),
		themeConfigFilename: 'theme.json'
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

	return [].concat(globalsVars(), globalMixins(), fonts());

	function globalsVars() {
		return filePaths('globals', 'vars.scss');
	}

	function globalMixins() {
		return filePaths('globals', 'mixins.scss');
	}

	function fonts() {
		return filePaths('fonts', 'fonts.scss', function(paths, src, themePath) {
			var config = readThemeConfig(themePath);
			if(config && config['replaceFonts']) paths = [];
			paths.push(src);
			return paths;
		});
	}

	function filePaths(dirname, filename, transform) {
		var paths = [];
		for (var i = 0; i < themePaths.length; ++i) {
			var src = path.join(themePaths[i], dirname, filename);
			if (fsxu.isFileSync(src)) {
				paths = (transform || transformDefault)(paths, src, themePaths[i]);
			}
		}

		return paths;

		function transformDefault(paths, src) {
			paths.push(src);
			return paths;
		}
	}
}

function resolveInjectThemePaths() {
	var nextPath = resolveUserThemeDependency();

	var themePaths = [];
	//last theme is user theme
	if (nextPath) themePaths.push(nextPath);

	while (nextPath = resolveThemeDependency(nextPath)) {
		//adding dependencies to front
		if (nextPath) themePaths.unshift(nextPath);
	}

	//add source path as first theme
	themePaths.unshift(paths.source);

	return themePaths;

	function resolveUserThemeDependency() {
		if (userConfig.site && typeof userConfig.site === 'string' && fsxu.isFileSync(path.join(userConfig.site, paths.themeConfigFilename))) {
			return userConfig.site;
		}
		if (userConfig.theme && typeof userConfig.theme === 'string' && fsxu.isFileSync(path.join(paths.themes, userConfig.theme, paths.themeConfigFilename))) {
			return path.join(paths.themes, userConfig.theme);
		}
		return null;
	}

	function resolveThemeDependency(themePath) {
		var themeConfig = themePath ? readThemeConfig(themePath) : null;

		return themeConfig && themeConfig.theme ? path.join(paths.themes, themeConfig.theme) : null;
	}
}

function readThemeConfig(themePath) {
	return fsxu.readJsonSync(path.join(themePath, paths.themeConfigFilename));
}