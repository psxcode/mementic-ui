const chai = require('chai'),
	expect = chai.expect,
	{resolve, join} = require('path'),
	mockfs = require('mock-fs'),
	{findUpSync} = require('fsxu'),
	loadModule = require('../tasks/load-module'),
	rootPath = findUpSync('package.json', {exclude: /node_modules/}),
	{
		resolveComponentTypeVarsFilepath,
		resolveComponentTypeFilepath,
		resolveComponentVarsFilepath,
		resolveComponentFilepath
	} = loadModule(join(rootPath, './tasks/resolve.js'));

describe('resolveComponentTypeVarsFilepath', function () {

	beforeEach(function () {
		mockfs({
			'root': {
				'type.name.vars.scss': '',
				'name.vars.scss': ''
			}
		});
	});

	afterEach(mockfs.restore);

	it('should find component type vars file', function () {
		const dirpath = './root',
			compTypeName = 'name',
			expected = resolve('./root/name.vars.scss'),
			actual = resolveComponentTypeVarsFilepath(dirpath, compTypeName);

		expect(actual).equal(expected);
	});

	it('should find another component type vars file', function () {
		const dirpath = './root',
			compname = 'type.name',
			expected = resolve('./root/type.name.vars.scss'),
			actual = resolveComponentTypeVarsFilepath(dirpath, compname);

		expect(actual).equal(expected);
	});

	it('should return \'undefined\' if file not found', function () {
		const dirpath = './root',
			compname = 'another-type.name',
			actual = resolveComponentTypeVarsFilepath(dirpath, compname);

		expect(actual).undefined;
	});
});

describe('resolveComponentTypeFilepath', function () {

	beforeEach(function () {
		mockfs({
			'root': {
				'type.name.scss': '',
				'name.scss': ''
			}
		});
	});

	afterEach(mockfs.restore);

	it('should find component name filepath', function () {

		const dirpath = './root',
			compname = 'name',
			expected = resolve('./root/name.scss'),
			actual = resolveComponentTypeFilepath(dirpath, compname);

		expect(expected).equal(actual);
	});

	it('should find component type name filepath', function () {

		const dirpath = './root',
			compname = 'type.name',
			expected = resolve('./root/type.name.scss'),
			actual = resolveComponentTypeFilepath(dirpath, compname);

		expect(expected).equal(actual);
	});

	it('should return \'undefined\' if file not found', function () {
		const dirpath = './root',
			compname = 'another-type.name',
			actual = resolveComponentTypeVarsFilepath(dirpath, compname);

		expect(actual).undefined;
	});
});

describe('resolveComponentVarsFilepath', function () {

	beforeEach(function () {
		mockfs({
			'root': {
				'type.name': {
					'type.name.scss': '',
					'type.name.vars.scss': ''
				},
				'name': {
					'name.scss': '',
					'vars.scss': ''
				}
			}
		});
	});

	afterEach(mockfs.restore);

	it('should find component vars filepath', function () {

		const dirpath = './root/name',
			compname = 'name',
			expected = resolve('./root/name/vars.scss'),
			actual = resolveComponentVarsFilepath(dirpath, compname);

		expect(expected).equal(actual);
	});

	it('should find another component vars filepath', function () {

		const dirpath = './root/type.name',
			compname = 'type.name',
			expected = resolve('./root/type.name/type.name.vars.scss'),
			actual = resolveComponentVarsFilepath(dirpath, compname);

		expect(expected).equal(actual);
	});

	it('should return \'undefined\' if file not found', function () {
		const dirpath = './root',
			compname = 'another-type.name',
			actual = resolveComponentVarsFilepath(dirpath, compname);

		expect(actual).undefined;
	});
});

describe('resolveComponentFilepath', function () {

	beforeEach(function () {
		mockfs({
			'root': {
				'type.name': {
					'type.name.scss': '',
					'type.name.vars.scss': ''
				},
				'name': {
					'name.scss': '',
					'vars.scss': ''
				}
			}
		});
	});

	afterEach(mockfs.restore);

	it('should find component main filepath', function () {

		const dirpath = './root/name',
			compname = 'name',
			expected = resolve('./root/name/name.scss'),
			actual = resolveComponentFilepath(dirpath, compname);

		expect(expected).equal(actual);
	});

	it('should find another component main filepath', function () {

		const dirpath = './root/type.name',
			compname = 'type.name',
			expected = resolve('./root/type.name/type.name.scss'),
			actual = resolveComponentFilepath(dirpath, compname);

		expect(expected).equal(actual);
	});

	it('should return \'undefined\' if file not found', function () {
		const dirpath = './root',
			compname = 'another-type.name',
			actual = resolveComponentFilepath(dirpath, compname);

		expect(actual).undefined;
	});
});
