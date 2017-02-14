"use strict";

var path = require('path');
var fsxu = require('fsxu');
var _ = require('lodash');


var importsPaths = null;
var importsNames = null;

//Exports
(function () {
	module.exports.getModulePaths = getModulePaths;
	module.exports.getPublicPaths = getPublicPaths;
	module.exports.getAllThemesModules = getThemeModules;
}());

function getPublicPaths() {
	if (!importsPaths) resolveImportsPaths();

	var result = [];

	_.forEach(importsPaths, function (themePath) {
		var pubPath = path.join(themePath, 'public');
		if (fsxu.isDirSync(pubPath)) {
			result.push(pubPath + '/**/**.*');
		}
	});

	return result;
}

function getThemeModules(collector) {
	if (!importsPaths) resolveImportsPaths();

	_.forEach(importsNames, function (mod) {
		collector(mod.name, mod.path);
	});
}

function getModulePaths(moduleName, modulePathInTheme) {
	if (!importsPaths) resolveImportsPaths();
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
		_.forEach(importsPaths, addFromTheme);

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
