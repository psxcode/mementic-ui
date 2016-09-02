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
		sassModuleFilepath: path.join(srcdir, 'module.scss'),
		themeConfigFilename: 'theme.json'
	};
}());

//InjectConfig
var injectOpts = null;
(function () {
	injectOpts = {
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

//Modules
var modules = [{
	path: '',
	names: ['globals']
}, {
	path: 'elements',
	names: ['button', 'container', 'divider', 'header', /*'icon',*/ 'image', 'input', 'label', 'list', 'loader', 'rail', 'reveal', 'segment', 'step']
}];

//User Config (set in initConfig)
var userConfig = {
	site: '',
	theme: '',
	output: 'build/'
};

//Exports
var themeDepsPaths = null;
(function () {
	module.exports = function initConfig(config) {
		if (config) {
			userConfig = config;
			themeDepsPaths = resolveThemeDepsPaths();
		}
	};

	module.exports.paths = paths;
	module.exports.getModulePaths = getModulePaths;
	module.exports.injectOpts = injectOpts;
	module.exports.modules = modules;
}());

function getModulePaths(moduleName, modulePathInTheme) {
	if (!themeDepsPaths) themeDepsPaths = resolveThemeDepsPaths();
	if (!modulePathInTheme) modulePathInTheme = '';

	console.log('stream module: ', modulePathInTheme + '::' + moduleName);

	switch (moduleName) {
		case 'globals':
			return srcGlobalsPaths();
		default:
			return srcPaths(modulePathInTheme, moduleName);
	}

	function srcPaths(pathInSources, moduleName) {

		return srcGlobalsVarsPaths().concat(
			srcFilePaths(pathInSources, moduleName, 'vars.scss'),
			srcFilePaths(pathInSources, moduleName, moduleName + '-vars.scss'),
			srcFilePaths(pathInSources, moduleName, moduleName + '.scss')
		);
	}

	function srcGlobalsPaths() {
		var moduleName = 'globals';

		return srcGlobalsVarsPaths().concat(
			srcFilePaths(null, moduleName, 'mixins.scss'),
			srcFilePaths(null, 'fonts', 'fonts.scss', fontsPathPush),
			srcFilePaths(null, moduleName, 'reset.scss'),
			srcFilePaths(null, moduleName, 'type.scss')
		);

		function fontsPathPush(paths, src, themePath) {
			var config = readThemeConfig(themePath);
			if (config && config['replaceFonts']) paths = [];
			paths.push(src);
			return paths;
		}
	}

	function srcGlobalsVarsPaths() {
		return srcFilePaths('', 'globals', 'vars.scss');
	}

	function srcFilePaths(pathInTheme, moduleName, filename, pushPathFunc) {
		if (!pathInTheme) pathInTheme = '';
		if (!moduleName) moduleName = '';
		if (!pushPathFunc) pushPathFunc = pushPathDefault;

		var outPaths = [];

		addFromTheme(paths.source);
		_.forEach(themeDepsPaths, addFromTheme);

		return outPaths;

		function addFromTheme(themePath) {

			var src = path.join(themePath, pathInTheme, filename);
			if (fsxu.isFileSync(src)) {
				outPaths = pushPathFunc(outPaths, src, themePath);
				return;
			}

			src = path.join(themePath, pathInTheme, moduleName, filename);
			if (fsxu.isFileSync(src)) {
				outPaths = pushPathFunc(outPaths, src, themePath);
			}
		}

		function pushPathDefault(paths, src) {
			paths.push(src);
			return paths;
		}
	}
}


function resolveThemeDepsPaths() {
	var themeDepsPropName = 'deps';
	var defaultThemeName = '_default';

	var result = [];
	var deps = userConfig[themeDepsPropName] || [];
	if (!_.isArray(deps)) deps = [deps];
	deps.unshift(defaultThemeName);

	flattenThemeDepsTree(deps);

	return result;

	function flattenThemeDepsTree(deps, parents) {
		if (!_.isArray(parents)) parents = [];

		if (_.isArray(deps)) {
			deps = _.filter(deps, isDepValid);
			_.forEach(deps, pushDep);
		} else if (_.isString(deps)) {
			isDepValid(deps) && pushDep(deps);
		}

		function pushDep(dep) {
			dep = getThemePath(dep);
			var themeConfig = readThemeConfig(dep) || {};
			flattenThemeDepsTree(themeConfig[themeDepsPropName], _.concat(parents, dep));
			result.push(dep);
		}

		function isDepValid(dep) {
			dep = getThemePath(dep);
			return dep && _.indexOf(parents, dep) < 0 && _.indexOf(result, dep) < 0;
		}
	}

	function isThemeValid(themeNameOrPath) {
		return !!getThemePath(themeNameOrPath);
	}

	function getThemePath(themeNameOrPath) {
		if (!/\/|\\/.test(themeNameOrPath)) {
			themeNameOrPath = path.join(paths.themes, themeNameOrPath);
		}
		var themeConfigFileFound = fsxu.isFileSync(path.join(themeNameOrPath, paths.themeConfigFilename));

		if (!themeConfigFileFound) {
			console.log('Dependency is invalid: ', themeNameOrPath);
		}

		return themeConfigFileFound ? themeNameOrPath : null;
	}
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