module.exports = {

	// directories with additional modules (resolved with 'path.resolve')
	from: ['./styles'],

	// loads all components of 'mementic' module
	entry_1: 'mementic',

	// loads all components of 'mementic' module
	entry_2: {'mementic': '*'},

	// loads all types of 'button' component of 'mementic' module
	entry_3: {'mementic': 'button'},

	// loads type 'group' of 'button' component of 'mementic' module
	entry_4: {'mementic': 'button.group'},

	// loads all types of 'button', excluding type 'group', then all types of 'input' of 'mementic' module
	entry_5: {'mementic': ['button', '!button.group', 'input']},

	// loads all components of 'mementic' module, then all components of 'fonts-google' module
	entry_6: ['mementic', 'fonts-google'],

	// loads all components of 'mementic' module, then all components of 'fonts-google' module
	entry_7: [{'mementic': '*'}, 'fonts-google'],

	// multiple entries
	// entries ending with number are compiled in order, excluding compiled components by-type
	entries: {
		entry_1: 'mementic',
		entry_2: {'mementic': '*'},
		entry_3: {'mementic': 'button'},
		entry_4: {'mementic': 'button.group'},
		entry_5: {'mementic': ['button', '!button.group', 'input']},
		entry_6: ['mementic', 'fonts-google'],
		entry_7: [{'mementic': '*'}, 'fonts-google'],
		vendor: [{'mementic': '*'}, 'fonts-google']
	},

	output: {
		path: '../static',
		filename: '[name].css'
	}
};
