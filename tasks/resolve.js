"use strict";

const {resolve} = require('path'),
	_ = require('lodash');

const {
	isFileSync,
	isDirSync,
	listDirNamesSync,
	listFileNamesSync
} = require('fsxu');

const {
	getComponentTypeName,
	isValidModuleName,
	isValidComponentName,
	isValidComponentFilename,
	isValidComponentTypeFilename
} = require('./helpers');

module.exports = function () {
	const config = require('./config')();

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
	const moduleConfigFilenames = config.moduleConfigFilenames,
		configModuleDirs = config.moduleDirs;

	return _.chain(resolveDirectories('./', configModuleDirs))

	// resolve modules
		.reduce((modules, dirObj) => _.chain(listDirNamesSync(dirObj.path))

			// ignore special dir names
				.filter(isValidModuleName)

				// push modules
				.reduce((allModules, moduleName) => {
					const modulePath = resolve(dirObj.path, moduleName),
						moduleConfigFilepaths = moduleConfigFilenames.map((filename) => resolve(modulePath, filename)),
						moduleConfigFilepath = _.find(moduleConfigFilepaths, isFileSync),
						moduleConfig = resolveModuleConfigFile(moduleConfigFilepath);

					// push only valid modules
					if (moduleConfig != null) {
						allModules[moduleName] = {
							moduleName: moduleName,
							modulePath: modulePath,
							config: moduleConfig
						};
					}

					return allModules;
				}, modules)

			, Object.create(null));
}

function resolveModuleComponents(config, module) {
	const moduleConfigExportKeys = config.moduleConfigExportKeys,
		moduleGlobalsComponentNames = config.moduleGlobalsComponentNames,

		// resolve module components for all exported directories
		components = _.chain(resolveModuleExportPaths(moduleConfigExportKeys, module))
			.reduce((components, pathWithComponents) =>
					// list all possible component directories
					_.chain(listDirNamesSync(pathWithComponents))

					// filter out invalid component names
						.filter(isValidComponentName)

						// resolve components
						.reduce((allComponents, compName) => {
							const compPath = resolve(pathWithComponents, compName),
								compMainFilepath = resolveComponentFilepath(compPath, compName),
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
						}, components)

				, Object.create(null));

	// add module globals component
	components._globals = resolveModuleGlobalComponents(moduleGlobalsComponentNames, module);

	return components;
}

function resolveComponentTypes(compName, compPath) {

	// list all possible component-type files
	const componentTypes = _.chain(listFileNamesSync(compPath))

	// filter out invalid type filenames
		.filter(compTypeFilename => isValidComponentTypeFilename(compName, compTypeFilename))

		// resolve component-types
		.reduce((allTypes, compTypeFilename) => {
			const compTypeName = getComponentTypeName(compName, compTypeFilename),
				compType = {
					mainFilepath: resolveComponentTypeFilepath(compPath, compTypeName),
					varsFilepath: resolveComponentTypeVarsFilepath(compPath, compTypeName)
				};

			return allTypes[compTypeName] = compType, allTypes;
		}, Object.create(null));

	return componentTypes;
}

function resolveModuleGlobalComponents(moduleGlobalsComponentNames, module) {
	return _.chain(moduleGlobalsComponentNames)

		.reduce((globals, compName) => {
			const compFilepath = resolve(module.modulePath, 'globals', compName + '.scss');

			// add valid component path
			if (isFileSync(compFilepath)) {
				globals[compName] = compFilepath;
			}

			return globals;
		}, Object.create(null));
}

function resolveModuleExportPaths(moduleConfigExportKeys, module) {
	const modulePath = module.modulePath,
		moduleExportDirnames = _.find(moduleConfigExportKeys, exportKey => module.hasOwnProperty(exportKey)) || [];

	// get export directories
	return resolveDirectories(modulePath, moduleExportDirnames);
}

function resolveDirectories(path, dirnames) {
	return _.chain(dirnames)
		.map(name => ({
			name: name,
			path: resolve(path, name)
		}))
		.filter(dir => isDirSync(dir.path));
}

function resolveModuleConfigFile(filepath) {
	try {
		return require(filepath);
	} catch (e) {
	}
	return null;
}

function resolveComponentFilepath(path, name) {
	return _.find([
		resolve(path, name + '.scss')
	], isFileSync);
}

function resolveComponentVarsFilepath(path, name) {
	return _.find([
		resolve(path, 'vars.scss'),
		resolve(path, name + '.vars.scss')
	], isFileSync);
}

function resolveComponentTypeFilepath(path, name) {
	return _.find([
		resolve(path, name + '.scss')
	], isFileSync);
}

function resolveComponentTypeVarsFilepath(path, name) {
	return _.find([
		resolve(path, name + '.vars.scss')
	], isFileSync);
}
