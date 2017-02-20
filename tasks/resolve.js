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
	var modules = resolveModuleDirs(config);

	_.forEach(modules, function (module) {
		module.components = resolveModuleComponents(config, module);

		_.forEach(module.components, function(comp) {
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
		exportPaths = resolveModuleExportPaths(moduleConfigExportKeys, module),
		components = {
			globals: resolveModuleGlobalComponents(moduleGlobalsComponentNames, module)
		};

	return exportPaths
		.reduce(function (components, pathWithComponents) {

			return fsxu.listDirDirnamesSync(pathWithComponents)

			// filter out ignored components
				.filter(function (compName) {
					var ignored = _.startsWith(compName, '_') ||
						compName === moduleGlobalsComponentNames;
					return !ignored;
				})

				.map(function (compName) {
					var compPath = path.resolve(path.join(pathWithComponents, compName)),
						compMainFilepath = resolveComponentMainFilepath(compPath, compName),
						compVarsFilepath = resolveComponentVarsFilepath(compPath, compName);

					return {
						name: compName,
						path: compPath,
						mainFilepath: compMainFilepath,
						varsFilepath: compVarsFilepath
					}
				})

				.reduce(function (allComponents, comp) {
					return allComponents[comp.name] = comp, allComponents;
				}, components);

		}, components);
}

function resolveComponentTypes(component) {

	var componentTypes = fsxu.listDirFilenamesSync(component.path)

	// filter out ignored
		.filter(function (compTypeFilename) {
			var ignored = !isComponentTypeFilenameValid(component.name, compTypeFilename);
			return !ignored;
		})

		.map(function (compTypeFilename) {
			var compTypeName = getComponentTypeName(component.name, compTypeFilename);

			return {
				name: compTypeName,
				path: component.path,
				mainFilepath: resolveComponentTypeFilepath(component.path, compTypeName),
				varsFilepath: resolveComponentTypeVarsFilepath(component.path, compTypeName)
			}
		})

		.reduce(function (allTypes, compType) {
			allTypes[compType.name] = compType;
		}, {});

	return componentTypes;
}

function resolveModuleGlobalComponents(moduleGlobalsComponentNames, module) {
	return _.reduce(moduleGlobalsComponentNames, function (obj, compName) {
		var compFilepath = path.join(module.modulePath, compName + '.scss');

		// add valid component path
		if (fsxu.isFileSync(compFilepath)) {
			obj[compName] = compFilepath;
		}

		return obj;
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
			}
		})

		// filter out invalid export dirs
		.filter(function (dirObj) {
			return fsxu.isDirSync(dirObj.path);
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
	], fsxu.isFileSync)
}

function resolveComponentTypeFilepath(path, name) {
	return _.find([
		path.join(path, name + '.scss')
	], fsxu.isFileSync);
}

function resolveComponentTypeVarsFilepath(path, name) {
	return _.find([
		path.join(path, name + '.vars.scss')
	], fsxu.isFileSync)
}
