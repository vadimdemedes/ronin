var ronin = require('../');

var program = ronin();

program.set({
	path: __dirname,
	desc: 'Ronin CLI utility to create base for programs'
});

program.run();
