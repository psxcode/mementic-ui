"use strict";


/*
 module.exports = {
 depsDir: ['dir1', 'dir2'],
 deps: ['depName', 'depPath'],
 modules: [{
 path: 'moduleLocalPath',
 names: ['module1', 'module2']
 }, {
 path: 'anotherPath',
 names: ['module3', 'module4']
 }]
 };
 */


module.exports = {
	deps: ['mem-vars', 'mem-reset', 'mem-elements', 'mem-collections', 'mem-views'],
	modules: [{
		path: '',
		name: 'globals'
	}]
};
