exports.prop = getPropertyByKeys;

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
