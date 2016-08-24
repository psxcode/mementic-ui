"use strict";

var path = require('path');
var fsxu = require('fsxu');
var _ = require('lodash');

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

var themeDepsPropName = 'deps';
var defaultThemeName = 'default';

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
		if (config) userConfig = config;
	};

	module.exports.paths = paths;
	module.exports.userCfg = userConfig;
	module.exports.getInjectPaths = srcPaths;
	module.exports.injectOpts = injectConfig;
}());


function srcPaths() {
	var themePaths = resolveInjectThemePaths();

	return [].concat(globalsVars(), globalMixins(), fonts(), globalType());

	function globalsVars() {
		return filePaths('globals', 'vars.scss');
	}

	function globalMixins() {
		return filePaths('globals', 'mixins.scss');
	}

	function globalType() {
		return filePaths('globals', 'type.scss');
	}

	function fonts() {
		return filePaths('fonts', 'fonts.scss', function (paths, src, themePath) {
			var config = readThemeConfig(themePath);
			if (config && config['replaceFonts']) paths = [];
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
	var result = [];
	var deps = userConfig[themeDepsPropName] || [];
	if(!_.isArray(deps)) deps = [deps];
	deps.unshift(defaultThemeName);

	flattenThemeDepsTree(deps);

	return result;

	function flattenThemeDepsTree(deps, parents) {
		if(!_.isArray(parents)) parents = [];

		if (_.isArray(deps)) {
			deps = _.filter(deps, isDepValid);
			_.forEach(deps, pushDep);
		} else if (_.isString(deps)) {
			isDepValid(deps) && pushDep(deps);
		}

		function pushDep(dep) {
			dep = getThemePath(dep);

			if(_.indexOf(result, dep) < 0) {
				var themeConfig = readThemeConfig(dep) || {};
				flattenThemeDepsTree(themeConfig[themeDepsPropName], _.concat(parents, dep));
				result.push(dep);
			}
		}

		function isDepValid(dep) {
			dep = getThemePath(dep);
			return dep && _.indexOf(parents, dep) < 0;
		}
	}
}

function isThemeValid(themeNameOrPath) {
	return !!getThemePath(themeNameOrPath);
}

function getThemePath(themeNameOrPath) {
	if (!/\/|\\/.test(themeNameOrPath)) {
		themeNameOrPath = path.join(paths.themes, themeNameOrPath);
	}
	return fsxu.isFileSync(path.join(themeNameOrPath, paths.themeConfigFilename)) ? themeNameOrPath : null;
}

function readThemeConfig(themePath) {
	return fsxu.readJsonSync(path.join(themePath, paths.themeConfigFilename));
}

function requireThemeConfig(themePath) {
	try {
		return require(path.join(themePath, paths.themeConfigFilename));
	} catch (e) {}
	return null;
}