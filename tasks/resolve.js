"use strict";

var path = require('path');
var fsxu = require('fsxu');
var _ = require('lodash');

var config = require('./config');

var themeConfigFilename = config.themeConfigFilename;
var themeDirs = config.themeDirs;

module.exports = function (imports) {
	
	// update values from config
	themeDirs = config.themeDirs;

	var deps = [];
	
	_.forEach(Object.keys(imports), function(key) {
		deps.push((Object.create(null))[key] = imports[key])
	});

	//always include default theme
	deps.unshift('_globals');

	var flattenResult = flattenImportsTree(deps);

	//debug print
	_.forEach(flattenResult.paths, function (res) {
		console.log('resolved path: ' + res);
	});

	return flattenResult;
};

function flattenImportsTree(deps, result, parents) {
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
				flattenImportsTree(themeConfig.deps, result, _.concat(parents, depPath));

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
			var themeExports = getThemeExports(themeConfig);
			var depModules = getDepModuleDefinitions(dep);
			var pushModules = themeExports;

			if (depModules.length > 0) {
				//check if modules are in ignore mode
				if (depModules[0].ignore) {

					//modules are in ignore mode
					pushModules = _.filter(themeExports, function (themeMod) {

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
							_.forEach(themeExports, function (themeMod) {
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

	function getThemeExports(themeConfig) {
		var modules = [];

		//get modules property
		var themeModules = themeConfig.export || themeConfig.exports || [];
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
			themeConfigFileFound = fsxu.isFileSync(path.join(themeNameOrPath, themeConfigFilename));
		} else {
			//theme name provided

			//iterate all theme dirs
			for (var i = 0; i < themeDirs.length; ++i) {
				var themeDir = path.join(themeDirs[i], themeNameOrPath);
				themeConfigFileFound = fsxu.isFileSync(path.join(themeDir, themeConfigFilename));
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

function requireThemeConfig(themePath) {
	try {
		return require(path.resolve(path.join(themePath, paths.themeConfigFilename)));
	} catch (e) {
	}
	return null;
}
