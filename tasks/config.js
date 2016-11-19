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
		sourceDir: srcdir,
		sassModuleFilepath: path.join(srcdir, 'module.scss'),
		themeConfigFilename: 'mem-config.js',
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

var themeDepsPaths = null;
var themeModules = null;

//Exports
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
			resolveThemeDepsPaths();
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
	module.exports.getAllThemesModules = getThemeModules;
	module.exports.isConfigured = isConfigured;
	module.exports.injectOpts = injectOpts;
}());

function isConfigured() {
	return !!userConfig;
}

function getPublicPaths() {
	if (!themeDepsPaths) resolveThemeDepsPaths();

	var result = [];

	_.forEach(themeDepsPaths, function (themePath) {
		var pubPath = path.join(themePath, 'public');
		if (fsxu.isDirSync(pubPath)) {
			result.push(pubPath + '/**/**.*');
		}
	});

	return result;
}

function getThemeModules(collector) {
	if (!themeDepsPaths) resolveThemeDepsPaths();

	_.forEach(themeModules, function (mod) {
		collector(mod.name, mod.path);
	});
}

function getModulePaths(moduleName, modulePathInTheme) {
	if (!themeDepsPaths) resolveThemeDepsPaths();
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
		return srcGlobalsVarsPaths().concat(
			//srcFilePaths(null, paths.globalsName, 'fonts.scss'),
			//srcFilePaths(null, paths.globalsName, 'reset.scss'),
			srcFilePaths(null, paths.globalsName, 'anims.scss')
		);
	}

	function srcGlobalsVarsPaths() {
		return srcFilePaths('', paths.globalsName, 'vars.scss');
	}

	function srcFilePaths(pathInTheme, moduleName, filename) {
		if (!pathInTheme) pathInTheme = '';
		if (!moduleName) moduleName = '';

		var outPaths = [];

		addFromTheme(paths.sourceDir);
		_.forEach(themeDepsPaths, addFromTheme);

		return outPaths;

		function addFromTheme(themePath) {

			var src = path.join(themePath, pathInTheme, filename);
			if (fsxu.isFileSync(src)) {
				outPaths.push(src);
				return;
			}

			src = path.join(themePath, pathInTheme, moduleName, filename);
			if (fsxu.isFileSync(src)) {
				outPaths.push(src);
			}
		}
	}
}


function resolveThemeDepsPaths() {
	var user = userConfig || userConfigDefault;

	var deps = user.deps || [];
	if (!_.isArray(deps)) deps = [deps];

	//always include _default theme
	deps.unshift('_globals');

	var flattenResult = flattenThemeDepsTree(deps);
	themeDepsPaths = flattenResult.paths;
	themeModules = flattenResult.modules;

	//debug print
	_.forEach(themeDepsPaths, function (res) {
		console.log('resolved path: ' + res);
	});

	function flattenThemeDepsTree(deps, result, parents) {
		if (!result) result = {paths: [], modules: []};
		if (!_.isArray(parents)) parents = [];

		if (_.isArray(deps)) {
			_.forEach(deps, pushDep);
		} else if (_.isString(deps)) {
			pushDep(deps);
		}

		function pushDep(dep) {
			var depName = getDepName(dep);
			var depPath = getThemePath(depName);
			var themeConfig = requireThemeConfig(depPath) || {};

			if (depPath && checkCircularDep(depPath)) {

				//prepare push modules
				var pushModules = getPushModules(dep);

				//check module already added
				pushModules = _.filter(pushModules, function (mod) {
					for (var i = 0; i < result.modules.length; ++i) {
						if (mod.name === result.modules[i].name && mod.path === result.modules[i].path) {
							return false;
						}
					}

					return true;
				});

				//do not add same dep path
				if (checkDepPathAlreadyPushed(depPath)) {
					//recursive call
					flattenThemeDepsTree(themeConfig.deps, result, _.concat(parents, depPath));

					//add dep path
					result.paths.push(depPath);
				}

				//push modules after recursive call
				if (pushModules.length > 0) {
					//add dep modules
					Array.prototype.push.apply(result.modules, pushModules);
				}
			}

			function getPushModules(dep) {
				var themeModules = getThemeModuleDefinitions(themeConfig);
				var depModules = getDepModuleDefinitions(dep);
				var pushModules = themeModules;

				if (depModules.length > 0) {
					//check if modules are in ignore mode
					if (depModules[0].ignore) {

						//modules are in ignore mode
						pushModules = _.filter(themeModules, function (themeMod) {

							//using for to early interrupt loop
							for (var i = 0; i < depModules.length; ++i) {
								var depMod = depModules[i];

								// if name and path? are set then ignore
								if (themeMod.name === depMod.name &&
									(_.isString(depMod.path) ? themeMod.path === depMod.path : true)) {
									return false;
								}
							}
							return true;
						})
					} else {

						//modules are in add mode
						pushModules = [];

						_.forEach(depModules, function (mod) {
							if (_.isString(mod.path)) {
								pushModules.push({
									path: mod.path || '',
									name: mod.name
								})
							} else {
								//add all modules with name from themeModules
								_.forEach(themeModules, function (themeMod) {
									if (mod.name === themeMod.name) {
										pushModules.push({
											path: themeMod.path,
											name: themeMod.name
										});
									}
								});
							}
						})
					}
				}

				return pushModules;
			}
		}

		return result;

		function checkCircularDep(dep) {
			var isCircular = _.indexOf(parents, dep) >= 0;

			if (isCircular) {
				throw new Error('circular dependency: ' + dep);
			}

			return !isCircular;
		}

		function checkDepPathAlreadyPushed(dep) {
			var isPushed = _.indexOf(result.paths, dep) >= 0;

			if (isPushed) {
				console.log('dep already exist: ' + dep);
			}

			return !isPushed;
		}

		function getDepName(dep) {
			return _.isObject(dep) ? Object.keys(dep)[0] : dep;
		}

		function getThemeModuleDefinitions(themeConfig) {
			var modules = [];

			//get modules property
			var themeModules = themeConfig.modules || themeConfig.module || [];
			//convert to array if necessary
			if (!_.isArray(themeModules)) themeModules = [themeModules];

			//iterate modules
			_.forEach(themeModules, function (mod) {
				//get modules names property
				var names = mod.names || mod.name;
				var modPath = mod.path || '';

				//convert to array
				if (!_.isArray(names)) names = [names];

				//remove invalid names
				names = _.filter(names, function (name) {
					return name && _.isString(name);
				});

				//return converted names
				Array.prototype.push.apply(modules, _.map(names, function (name) {
					return {
						path: modPath,
						name: name
					};
				}));
			});

			return modules;
		}

		function getDepModuleDefinitions(dep) {
			var modules = _.isObject(dep) ? dep[getDepName(dep)] : [];
			var ignoredOnce = false;
			if (!_.isArray(modules)) modules = [modules];

			//filter invalid module definitions
			modules = _.filter(modules, function (mod) {
				return mod && _.isString(mod);
			});

			modules = _.map(modules, function (mod) {
				var path = null;
				var name = mod;
				var ignore = false;

				checkIgnore();

				var pathElements = mod.split('/');
				if (pathElements.length > 1) {
					name = pathElements.pop();
					path = pathElements.join('/');

					checkIgnore();
				}

				return {
					path: path,
					name: name,
					ignore: ignore
				};

				function checkIgnore() {
					if (name[0] === '!') {
						ignore = ignoredOnce = true;
						name = name.substring(1);
					}
				}
			});

			modules = _.filter(modules, function (mod) {
				return ignoredOnce ? mod.ignore : !mod.ignore;
			});

			return modules;
		}
	}

	function getThemePath(themeNameOrPath) {
		var themeConfigFileFound = false;

		if (themeNameOrPath && _.isString(themeNameOrPath)) {
			if (/\/|\\/.test(themeNameOrPath)) {
				//theme path provided
				themeConfigFileFound = fsxu.isFileSync(path.join(themeNameOrPath, paths.themeConfigFilename));
			} else {
				//theme name provided

				//iterate all theme dirs
				for (var i = 0; i < paths.depsDirs.length; ++i) {
					var themeDir = path.join(paths.depsDirs[i], themeNameOrPath);
					themeConfigFileFound = fsxu.isFileSync(path.join(themeDir, paths.themeConfigFilename));
					if (themeConfigFileFound) {
						themeNameOrPath = themeDir;
						break;
					}
				}
			}
		}

		if (!themeConfigFileFound) {
			throw new Error('Dependency is invalid: ' + themeNameOrPath);
		}

		return themeNameOrPath;
	}
}

function requireThemeConfig(themePath) {
	try {
		var requireModule = path.resolve(path.join(themePath, paths.themeConfigFilename));
		delete require.cache[requireModule];
		return require(requireModule);
	} catch (e) {
	}
	return null;
}
