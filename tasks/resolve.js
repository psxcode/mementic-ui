"use strict";

var path = require('path');
var _ = require('lodash');
var fsxu = require('./fsxu');

module.exports = function () {
	var config = require('./config')();

	// get valid theme directory objects
	var themes = resolveThemeDirs(config);

	_.forEach(themes, function (theme) {
		theme.components = resolveThemeComponents(config, theme);

		_.forEach(theme.components, function(comp) {
			comp.subcomponents = resolveComponentSubcomponents(comp);
		});
	});
};

function resolveThemeDirs(config) {
	var themeConfigFilenames = config.themeConfigFilenames,
		configThemeDirs = config.themeDirs;

	return configThemeDirs

	// resolve dirs
		.map(function (dirname) {
			return {
				name: dirname,
				path: path.resolve(dirname)
			}
		})

		// filter out invalid theme dirs
		.filter(function (dirObj) {
			return fsxu.isDirSync(dirObj.name);
		})

		.reduce(function (themesObj, dirObj) {

			return fsxu.listDirDirnamesSync(dirObj.path)

			// ignore special dir names
				.filter(function (themeName) {
					var ignored = _.startsWith(themeName, '_') && themeName !== '_globals';
					return !ignored;
				})

				// resolve themes
				.map(function (themeName) {
					var themePath = path.resolve(path.join(dirObj.path, themeName)),
						themeConfigFilepaths = themeConfigFilenames.map(function (filename) {
							return path.join(themePath, filename);
						}),
						themeConfigFilepath = _.find(themeConfigFilepaths, function (filepath) {
							return fsxu.isFileSync(filepath);
						});

					return {
						themeName: themeName,
						themePath: themePath,
						configFilepath: themeConfigFilepath
					}
				})

				// filter out invalid themes
				.filter(function (themeObj) {
					return themeObj.configFilepath != null;
				})

				// add config file
				.map(function (themeObj) {
					themeObj.config = resolveThemeConfigFile(themeObj.configFilepath);
					return themeObj;
				})

				// filter out themes with invalid config files
				.filter(function (themeObj) {
					return themeObj.config != null;
				})

				// push themes
				.reduce(function (allThemes, themeObj) {
					allThemes[themeObj.themeName] = themeObj;
					return allThemes;
				}, themesObj);

		}, {});
}

function resolveThemeComponents(config, themeConfig) {
	var themeConfigExportKeys = config.themeConfigExportKeys,
		themeGlobalsComponentNames = config.themeGlobalsComponentNames,
		exportPaths = resolveThemeExportPaths(themeConfigExportKeys, themeConfig),
		components = {
			globals: resolveThemeGlobalComponents(themeGlobalsComponentNames, themeConfig)
		};

	return exportPaths
		.reduce(function (components, pathWithComponents) {

			return fsxu.listDirDirnamesSync(pathWithComponents)

			// filter out ignored components
				.filter(function (compName) {
					var ignored = _.startsWith(compName, '_') || compName === themeGlobalsComponentNames;
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

function resolveComponentSubcomponents(componentConfig) {

	var subcomps = fsxu.listDirFilenamesSync(componentConfig.path)

	// filter out ignored
		.filter(function (subcompFilename) {
			var ignored = !isSubComponentFilenameValid(componentConfig.name, subcompFilename);
			return !ignored;
		})

		.map(function (subcompFilename) {
			var subcompName = getSubComponentName(componentConfig.name, subcompFilename);

			return {
				name: subcompName,
				path: componentConfig.path,
				mainFilepath: resolveSubcomponentFilepath(componentConfig.path, subcompName),
				varsFilepath: resolveSubcomponentVarsFilepath(componentConfig.path, subcompName)
			}
		})

		.reduce(function (subcomps, subcompFilename) {

		}, {});

	return subcomps;
}

function resolveThemeGlobalComponents(themeGlobalsComponentNames, themeObj) {
	return _.reduce(themeGlobalsComponentNames, function (obj, compName) {
		var compFilepath = path.join(themeObj.themePath, compName + '.scss');

		// add valid component path
		if (fsxu.isFileSync(compFilepath)) {
			obj[compName] = compFilepath;
		}

		return obj;
	}, {});
}

function resolveThemeExportPaths(themeConfigExportKeys, themeConfig) {
	var themePath = themeConfig.themePath,
		themeExportDirnames = _.find(themeConfigExportKeys, function (exportKey) {
				return themeConfig.hasOwnProperty(exportKey);
			}) || [];

	// get export directories
	return themeExportDirnames
		.map(function (dirname) {
			var dirpath = path.join(themePath, dirname);

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

function resolveThemeConfigFile(filepath) {
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

function resolveSubcomponentFilepath(path, name) {
	return _.find([
		path.join(path, name + '.scss')
	], fsxu.isFileSync);
}

function resolveSubcomponentVarsFilepath(path, name) {
	return _.find([
		path.join(path, name + '.vars.scss')
	], fsxu.isFileSync)
}

function getSubComponentNameEnd(compName) {
	return '.' + compName;
}

function getSubComponentFilenameEnd(compName) {
	return getSubComponentNameEnd(compName) + '.scss';
}

function getSubComponentName(compName, subCompFilename) {
	if (!isSubComponentFilenameValid(compName, subCompFilename)) {
		return null;
	}

	var compNameEnd = getSubComponentFilenameEnd(compName),
		compNameIndex = subCompFilename.indexOf(compNameEnd);

	if (compNameIndex <= 0) {
		return null;
	}

	return subCompFilename.substr(0, compNameIndex);
}

function isSubComponentFilenameValid(compName, subCompFilename) {
	return isComponentFilenameValid(subCompFilename) && _.endsWith(subCompFilename, getSubComponentFilenameEnd(compName));
}

function isComponentFilenameValid(compFilename) {
	return !_.startsWith(compFilename, '_') && _.endsWith(compFilename, '.scss');
}
