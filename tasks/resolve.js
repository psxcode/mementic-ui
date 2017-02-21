"use strict";

var path = require('path');
var _ = require('lodash');
var fsxu = require('./fsxu');

var getComponentTypeName = require('./helpers').getComponentTypeName;
var isComponentTypeFilenameValid = require('./helpers').isComponentTypeFilenameValid;
var isComponentFilenameValid = require('./helpers').isComponentFilenameValid;

module.exports = function () {
	var config = require('./config')();

	// get valid module directory objects
	var exported = resolveModuleDirs(config);

	_.forEach(exported, function (module) {
		module.components = resolveModuleComponents(config, module);

		_.forEach(module.components, function (comp) {
			comp.types = resolveComponentTypes(comp);
		});
	});
};

function resolveModuleDirs(config) {
	var moduleConfigFilenames = config.moduleConfigFilenames,
		configModuleDirs = config.moduleDirs;

	return configModuleDirs

	// resolve dirs
		.map(function (name) {
			return {
				name: name,
				path: path.resolve(name)
			}
		})

		// filter out invalid module dirs
		.filter(function (dir) {
			return fsxu.isDirSync(dir.name);
		})

		.reduce(function (modules, dirObj) {

			return fsxu.listDirDirnamesSync(dirObj.path)

			// ignore special dir names
				.filter(function (moduleName) {
					var ignored = _.startsWith(moduleName, '_') && moduleName !== '_globals';
					return !ignored;
				})

				// resolve modules
				.map(function (moduleName) {
					var modulePath = path.resolve(path.join(dirObj.path, moduleName)),
						moduleConfigFilepaths = moduleConfigFilenames.map(function (filename) {
							return path.join(modulePath, filename);
						}),
						moduleConfigFilepath = _.find(moduleConfigFilepaths, function (filepath) {
							return fsxu.isFileSync(filepath);
						});

					return {
						moduleName: moduleName,
						modulePath: modulePath,
						configFilepath: moduleConfigFilepath
					}
				})

				// filter out invalid modules
				.filter(function (module) {
					return module.configFilepath != null;
				})

				// add config file
				.map(function (module) {
					module.config = resolveModuleConfigFile(module.configFilepath);
					return module;
				})

				// filter out modules with invalid config files
				.filter(function (module) {
					return module.config != null;
				})

				// push modules
				.reduce(function (allModules, module) {
					allModules[module.moduleName] = module;
					return allModules;
				}, modules);

		}, {});
}

function resolveModuleComponents(config, module) {
	var moduleConfigExportKeys = config.moduleConfigExportKeys,
		moduleGlobalsComponentNames = config.moduleGlobalsComponentNames,

		// resolve module components for all exported directories
		components = resolveModuleExportPaths(moduleConfigExportKeys, module)
			.reduce(function (components, pathWithComponents) {

				// list all possible component directories
				return fsxu.listDirDirnamesSync(pathWithComponents)

				// filter out invalid component names
					.filter(function (compName) {
						var ignored = _.startsWith(compName, '_') ||
							compName === moduleGlobalsComponentNames;
						return !ignored;
					})

					// resolve components
					.reduce(function (allComponents, compName) {
						var compPath = path.resolve(path.join(pathWithComponents, compName)),
							compMainFilepath = resolveComponentMainFilepath(compPath, compName),
							compVarsFilepath = resolveComponentVarsFilepath(compPath, compName),

							component = {
								name: compName,
								path: compPath,
								types: resolveComponentTypes(compName, compPath)
							};

						// add component's main file
						component.types._main = {
							mainFilepath: compMainFilepath,
							varsFilepath: compVarsFilepath
						};

						return allComponents[compName] = component, allComponents;
					}, components);

			}, Object.create(null));

	// add module globals component
	components._globals = resolveModuleGlobalComponents(moduleGlobalsComponentNames, module);

	return components;
}

function resolveComponentTypes(compName, compPath) {

	// list all possible component-type files
	var componentTypes = fsxu.listDirFilenamesSync(compPath)

	// filter out invalid type filenames
		.filter(function (compTypeFilename) {
			var ignored = !isComponentTypeFilenameValid(compName, compTypeFilename);
			return !ignored;
		})

		// resolve component-types
		.reduce(function (allTypes, compTypeFilename) {
			var compTypeName = getComponentTypeName(compName, compTypeFilename),
				compType = {
					mainFilepath: resolveComponentTypeFilepath(compPath, compTypeName),
					varsFilepath: resolveComponentTypeVarsFilepath(compPath, compTypeName)
				};

			return allTypes[compTypeName] = compType, allTypes;
		}, Object.create(null));

	return componentTypes;
}

function resolveModuleGlobalComponents(moduleGlobalsComponentNames, module) {
	return _.reduce(moduleGlobalsComponentNames, function (globals, compName) {
		var compFilepath = path.join(module.modulePath, compName + '.scss');

		// add valid component path
		if (fsxu.isFileSync(compFilepath)) {
			globals[compName] = compFilepath;
		}

		return globals;
	}, {});
}

function resolveModuleExportPaths(moduleConfigExportKeys, module) {
	var modulePath = module.modulePath,
		moduleExportDirnames = _.find(moduleConfigExportKeys, function (exportKey) {
				return module.hasOwnProperty(exportKey);
			}) || [];

	// get export directories
	return moduleExportDirnames
		.map(function (dirname) {
			var dirpath = path.join(modulePath, dirname);

			return {
				name: dirname,
				path: dirpath
			};
		})

		// filter out invalid export dirs
		.filter(function (dir) {
			return fsxu.isDirSync(dir.path);
		});
}

function resolveModuleConfigFile(filepath) {
	try {
		var config = require(filepath);
	} catch (e) {
		return null;
	}
	return config;
}

function resolveComponentMainFilepath(path, name) {
	return _.find([
		path.join(path, name + '.scss')
	], fsxu.isFileSync);
}

function resolveComponentVarsFilepath(path, name) {
	return _.find([
		path.join(path, 'vars.scss'),
		path.join(path, name + '.vars.scss')
	], fsxu.isFileSync);
}

function resolveComponentTypeFilepath(path, name) {
	return _.find([
		path.join(path, name + '.scss')
	], fsxu.isFileSync);
}

function resolveComponentTypeVarsFilepath(path, name) {
	return _.find([
		path.join(path, name + '.vars.scss')
	], fsxu.isFileSync);
}
