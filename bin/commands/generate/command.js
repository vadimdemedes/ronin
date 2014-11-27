var Command = require('../../../').Command;
var Logger = require('../../../lib/logger');

var inflect = require('inflect');
var fs = require('fs');

var NewCommand = module.exports = Command.extend({
	desc: 'Create new command',
	
	run: function (name) {
		name = name.replace(/\:|\s/g, '/');
		
		var path = process.cwd() + '/commands/' + name + '.js';
		
		var commandName = inflect.camelize(name.replace('/', '_'));
		
		var file = fs.readFileSync(__dirname + '/../../skeleton/command/$name.js', 'utf-8');
		file = file.replace('$name', commandName);
		
		Logger.log('create', 'commands/' + name + '.js');
		fs.writeFileSync(path, file, 'utf-8');
	}
});