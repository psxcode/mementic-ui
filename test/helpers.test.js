const chai = require('chai'),
	expect = chai.expect,
	{
		getPropertyByKeys,
		getComponentTypeName,
		isValidModuleName,
		isValidComponentName,
		isValidComponentFilename,
		isValidComponentTypeFilename
	} = require('../tasks/helpers');

describe('getPropertyByKeys', function () {

	it('should return property', function () {
		const keys = ['val2'],
			obj = {
				val1: 42,
				val2: 'str'
			},
			actual = getPropertyByKeys(keys, obj);

		expect(actual).equal(obj.val2);
	});

	it('should return property', function () {
		const keys = ['val1', 'val2', 'val3'],
			obj = {
				val2: 'str'
			},
			actual = getPropertyByKeys(keys, obj);

		expect(actual).equal(obj.val2);
	});

	it('should return undefined if property was not found', function () {
		const keys = ['val1', 'val2', 'val3'],
			obj = {},
			actual = getPropertyByKeys(keys, obj);

		expect(actual).undefined;
	});
});

describe('isValidModuleName', function () {

	it('should', function () {
		const name = 'name',
			valid = isValidModuleName(name);

		expect(valid).true;
	});

	it('should', function () {
		const name = '_globals',
			valid = isValidModuleName(name);

		expect(valid).true;
	});

	it('should', function () {
		const name = '.invalid',
			valid = isValidModuleName(name);

		expect(valid).false;
	});

	it('should', function () {
		const name = '_invalid',
			valid = isValidModuleName(name);

		expect(valid).false;
	});
});

describe('isValidComponentName', function () {

	it('should', function () {
		const name = 'name',
			valid = isValidComponentName(name);

		expect(valid).true;
	});

	it('should', function () {
		const name = '.invalid',
			valid = isValidComponentName(name);

		expect(valid).false;
	});

	it('should', function () {
		const name = '_invalid',
			valid = isValidComponentName(name);

		expect(valid).false;
	});
});

describe('isValidComponentFilename', function () {

	it('should', function () {
		const name = 'name.scss',
			valid = isValidComponentFilename(name);

		expect(valid).true;
	});

	it('should', function () {
		const name = '.invalid.scss',
			valid = isValidComponentFilename(name);

		expect(valid).false;
	});

	it('should', function () {
		const name = '_invalid.scss',
			valid = isValidComponentFilename(name);

		expect(valid).false;
	});
});

describe('isValidComponentTypeFilename', function () {

	it('should', function () {
		const name = 'name',
			typeFilename = 'type.name.scss',
			valid = isValidComponentTypeFilename(name, typeFilename);

		expect(valid).true;
	});

	it('should', function () {
		const name = 'name',
			typeFilename = 'type.invalid.scss',
			valid = isValidComponentTypeFilename(name, typeFilename);

		expect(valid).false;
	});

	it('should', function () {
		const name = 'name',
			typeFilename = '.type.name.scss',
			valid = isValidComponentTypeFilename(name, typeFilename);

		expect(valid).false;
	});

	it('should', function () {
		const name = 'name',
			typeFilename = '_type.name.scss',
			valid = isValidComponentTypeFilename(name, typeFilename);

		expect(valid).false;
	});
});

describe('getComponentTypeName', function () {

	it('should', function () {
		const name = 'name',
			typeFilename = 'type.name.scss',
			result = getComponentTypeName(name, typeFilename);

		expect(result).equal('type');
	});

	it('should', function () {
		const name = 'name',
			typeFilename = 'another-type.name.scss',
			result = getComponentTypeName(name, typeFilename);

		expect(result).equal('another-type');
	});

	it('should', function () {
		const name = 'name',
			typeFilename = 'another.type.name.scss',
			result = getComponentTypeName(name, typeFilename);

		expect(result).equal('another.type');
	});

	it('should', function () {
		const name = 'another.name',
			typeFilename = 'another.type.another.name.scss',
			result = getComponentTypeName(name, typeFilename);

		expect(result).equal('another.type');
	});

	it('should', function () {
		const name = 'name',
			typeFilename = '.type.name.scss',
			result = getComponentTypeName(name, typeFilename);

		expect(result).equal('.type');
	});

	it('should', function () {
		const name = 'name',
			typeFilename = '_type.name.scss',
			result = getComponentTypeName(name, typeFilename);

		expect(result).equal('_type');
	});

	it('should', function () {
		const name = 'name',
			typeFilename = 'type.another.scss',
			result = getComponentTypeName(name, typeFilename);

		expect(result).null;
	});

	it('should', function () {
		const name = 'name',
			typeFilename = 'type.name.txt',
			result = getComponentTypeName(name, typeFilename);

		expect(result).null;
	});
});
