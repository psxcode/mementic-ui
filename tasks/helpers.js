const _ = require('lodash');

module.exports = {
	getPropertyByKeys,
	getComponentTypeName,
	isValidModuleName,
	isValidComponentName,
	isValidComponentFilename,
	isValidComponentTypeFilename
};

function getPropertyByKeys(keys, obj) {
	return obj[_.find(keys, k => obj[k])];
}

function getComponentTypeName(compName, compTypeFilename) {
	const compTypeNameEnd = getComponentTypeFilenameEnd(compName),
		compNameIndex = compTypeFilename.indexOf(compTypeNameEnd);

	return compNameIndex <= 0 ? null : compTypeFilename.substr(0, compNameIndex);
}

function isValidComponentTypeFilename(compName, compTypeFilename) {
	return isValidComponentFilename(compTypeFilename) && _.endsWith(compTypeFilename, getComponentTypeFilenameEnd(compName));
}

function isValidComponentFilename(name) {
	return !/^[_\W]/.test(name) && /\.scss$/.test(name);
}

function isValidComponentName(name) {
	// test restricted pattern
	return !/^[_\W]/.test(name);
}

function isValidModuleName(name) {
	// test allowed pattern, then test restricted
	return /^_globals$/.test(name) || !/^[_\W]/.test(name);
}

function getComponentTypeNameEnd(compName) {
	return '.' + compName;
}

function getComponentTypeFilenameEnd(compName) {
	return getComponentTypeNameEnd(compName) + '.scss';
}
