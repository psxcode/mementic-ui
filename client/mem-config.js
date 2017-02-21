var outputPath = '../static';

module.exports = {
	dry: true,
	moduleDir: [
		'./styles'
	],
	output: [{
		filename: 'preload.css',
		path: outputPath,
		imports: [
			{'mementic': ['button._default']}
		]
	}, {
		filename: 'style.css',
		path: outputPath,
		imports: [
			{'mementic': ['button']}
		]
	}]
};
