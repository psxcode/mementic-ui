var _ = require('lodash');

exports.prop = getPropertyByKeys;
exports.getComponentTypeName = getComponentTypeName;
exports.isComponentTypeFilenameValid = isComponentTypeFilenameValid;
exports.isComponentFilenameValid = isComponentFilenameValid;

function getPropertyByKeys(keys, obj) {
	for (var i = 0; i < keys.length; ++i) {
		if (obj.hasOwnProperty(keys[i])) {
			return obj[keys[i]];
		}
	}
}

// Array.prototype.map = function(func) {
// 	return _.map(this, func);
// };
//
// Array.prototype.filter = function(func) {
// 	return _.filter(this, func);
// };
//
// Array.prototype.reduce = function(func) {
// 	return _.reduce(this, func);
// };
//
// Array.prototype.forEach = function(func) {
// 	_.forEach(this, func);
// };
//
// Array.prototype.mod = function(func) {
// 	return _.forEach(this, func), this;
// };

function getComponentTypeName(compName, compTypeFilename) {
	if (!isComponentTypeFilenameValid(compName, compTypeFilename)) {
		return null;
	}

	var compTypeNameEnd = getComponentTypeFilenameEnd(compName),
		compNameIndex = compTypeFilename.indexOf(compTypeNameEnd);

	if (compNameIndex <= 0) {
		return null;
	}

	return compTypeFilename.substr(0, compNameIndex);
}

function isComponentTypeFilenameValid(compName, compTypeFilename) {
	return isComponentFilenameValid(compTypeFilename) && _.endsWith(compTypeFilename, getComponentTypeFilenameEnd(compName));
}

function isComponentFilenameValid(name) {
	return !_.startsWith(name, '_') && _.endsWith(name, '.scss');
}

function getComponentTypeNameEnd(compName) {
	return '.' + compName;
}

function getComponentTypeFilenameEnd(compName) {
	return getComponentTypeNameEnd(compName) + '.scss';
}
