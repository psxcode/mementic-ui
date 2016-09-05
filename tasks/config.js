"use strict";

var path = require('path');
var fsxu = require('fsxu');
var _ = require('lodash');

//Paths
var paths = null;
(function () {
	var rootdir = fsxu.findUpSync('package.json', __dirname);
	var srcdir = path.join(rootdir, 'themes');
	paths = {
		root: rootdir,
		depsDirs: [srcdir],
		source: srcdir,
		sassModuleFilepath: path.join(srcdir, 'module.scss'),
		themeConfigFilename: 'config.js',
		cssFilename: 'style.css',
		globalsName: 'globals'
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

//User Config (set in initConfig)
var userConfigDefault = {
	deps: ''
};
var userConfig = null;

//Exports
var themeDepsPaths = null;
(function () {
	module.exports = function initConfig(config) {
		if (config) {
			//set new config
			userConfig = config;

			//get css output filename
			paths.cssFilename = userConfig.cssFilename || paths.cssFilename;

			//get user dependency paths
			var depsDirs = userConfig.depsDir || userConfig.depsDirs;
			if (_.isArray(depsDirs)) {
				depsDirs.forEach(pushThemeDir);
			} else if (_.isString(depsDirs) && depsDirs.length > 0) {
				pushThemeDir(depsDirs);
			}

			//resolve dependencies paths
			themeDepsPaths = resolveThemeDepsPaths();
		}

		function pushThemeDir(dir) {
			var dirAbs = path.resolve(dir);
			if (!fsxu.isDirSync(dirAbs)) {
				throw new Error('Theme Dir is invalid: ' + dir + '. resolved to: ' + dirAbs);
			}

			if (checkDirAlreadyExists(dirAbs)) {
				paths.depsDirs.push(dirAbs);
			}
		}

		function checkDirAlreadyExists(dir) {
			var exists = _.indexOf(paths.depsDirs, dir) >= 0;

			return !exists;
		}
	};

	module.exports.paths = paths;
	module.exports.getModulePaths = getModulePaths;
	module.exports.getPublicPaths = getPublicPaths;
	module.exports.getModules = getModules;
	module.exports.isConfigured = isConfigured;
	module.exports.injectOpts = injectOpts;
}());

function isConfigured() {
	return !!userConfig;
}

function getPublicPaths() {
	if (!themeDepsPaths) themeDepsPaths = resolveThemeDepsPaths();

	var result = [];

	_.forEach(themeDepsPaths, function (themePath) {
		var pubPath = path.join(themePath, 'public');
		if (fsxu.isDirSync(pubPath)) {
			result.push(pubPath + '/**/**.*');
		}
	});

	return result;
}

function getModules(cb) {
	if (!themeDepsPaths) themeDepsPaths = resolveThemeDepsPaths();

	var modulesProcessed = [];

	_.forEach(themeDepsPaths, function (themePath) {
		var themeConfig = requireThemeConfig(themePath);

		//check if modules are defined
		if (themeConfig && _.isArray(themeConfig.modules)) {
			//iterate modules
			_.forEach(themeConfig.modules, function (mod) {
				//get modules names property
				var names = mod.names || mod.name;
				//convert to array
				if (_.isString(names) && names) names = [names];

				//iterate names
				if (_.isArray(names)) {
					_.forEach(names, function (name) {
						if (checkModuleAlreadyProcessed(name, mod.path)) {
							cb(name, mod.path);
						}
					});
				}
			});
		}
	});

	function checkModuleAlreadyProcessed(name, path) {
		var modUniqueName = path + '::' + name;
		var isProcessed = _.indexOf(modulesProcessed, modUniqueName) >= 0;

		//debug log
		if (isProcessed) {
			console.log('module already processed: ' + modUniqueName);
		}

		//push module to processed list
		if (!isProcessed) {
			modulesProcessed.push(modUniqueName);
		}

		return !isProcessed;
	}
}

function getModulePaths(moduleName, modulePathInTheme) {
	if (!themeDepsPaths) themeDepsPaths = resolveThemeDepsPaths();
	if (!modulePathInTheme) modulePathInTheme = '';

	console.log('stream module: ', modulePathInTheme + '::' + moduleName);

	switch (moduleName) {
		case paths.globalsName:
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
		var moduleName = paths.globalsName;

		return srcGlobalsVarsPaths().concat(
			srcFilePaths(null, 'fonts', 'fonts.scss', fontsPathPush),
			srcFilePaths(null, moduleName, 'reset.scss')
		);

		function fontsPathPush(paths, src, themePath) {
			var config = requireThemeConfig(themePath);
			if (config && config['replaceFonts']) paths = [];
			paths.push(src);
			return paths;
		}
	}

	function srcGlobalsVarsPaths() {
		return srcFilePaths('', paths.globalsName, 'vars.scss');
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
	var user = userConfig || userConfigDefault;

	var deps = user[themeDepsPropName] || [];
	if (!_.isArray(deps)) deps = [deps];
	deps.unshift(defaultThemeName);

	var result = user.ignoreThemeDeps ? ignoreThemeDepsTree(deps) : flattenThemeDepsTree(deps);

	//debug print
	_.forEach(result, function (res) {
		console.log('resolved path: ' + res);
	});

	return result;

	function ignoreThemeDepsTree(deps, result) {
		if (!_.isArray(result)) result = [];

		if (_.isArray(deps)) {
			_.forEach(deps, pushDep);
		} else if (_.isString(deps)) {
			pushDep(deps);
		}

		function pushDep(dep) {
			dep = getThemePath(dep);

			if (dep && checkAlreadyPushed(dep, result)) {
				result.push(dep);
			}
		}

		return result;
	}

	function flattenThemeDepsTree(deps, result, parents) {
		if (!_.isArray(result)) result = [];
		if (!_.isArray(parents)) parents = [];

		if (_.isArray(deps)) {
			_.forEach(deps, pushDep);
		} else if (_.isString(deps)) {
			pushDep(deps);
		}

		function pushDep(dep) {
			dep = getThemePath(dep);

			if (dep && checkCircularDep(dep, parents) && checkAlreadyPushed(dep, result)) {
				var themeConfig = requireThemeConfig(dep) || {};
				flattenThemeDepsTree(themeConfig[themeDepsPropName], result, _.concat(parents, dep));
				result.push(dep);
			}
		}

		return result;
	}

	function checkCircularDep(dep, parents) {
		var isCircular = _.indexOf(parents, dep) >= 0;

		if (isCircular) {
			console.log('circular dep: ' + dep);
		}

		return !isCircular;
	}

	function checkAlreadyPushed(dep, result) {
		var isPushed = _.indexOf(result, dep) >= 0;

		if (isPushed) {
			console.log('dep already exist: ' + dep);
		}

		return !isPushed;
	}

	function getThemePath(themeNameOrPath) {
		var themeConfigFileFound = false;

		if (!/\/|\\/.test(themeNameOrPath)) {
			for (var i = 0; i < paths.depsDirs.length; ++i) {
				var themeDir = path.join(paths.depsDirs[i], themeNameOrPath);
				themeConfigFileFound = fsxu.isFileSync(path.join(themeDir, paths.themeConfigFilename));
				if (themeConfigFileFound) {
					themeNameOrPath = themeDir;
					break;
				}
			}
		} else {
			themeConfigFileFound = fsxu.isFileSync(path.join(themeNameOrPath, paths.themeConfigFilename));
		}

		if (!themeConfigFileFound) {
			throw new Error('Dependency is invalid: ' + themeNameOrPath);
		}

		return themeConfigFileFound ? themeNameOrPath : null;
	}
}

function requireThemeConfig(themePath) {
	try {
		return require(path.resolve(path.join(themePath, paths.themeConfigFilename)));
	} catch (e) {}
	return null;
}