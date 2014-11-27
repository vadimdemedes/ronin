var Command = require('../../').Command;
var Logger = require('../../lib/logger');

var basename = require('path').basename;
var util = require('../../lib/util');
var exec = require('child_process').exec;
var fs = require('fs');

var walk = util.walk;

var NewCommand = module.exports = Command.extend({
	desc: 'Create new application',
	
	run: function (name) {
		this.name = name;
		
		var path = this.path = process.cwd() + '/' + name;
		
		try {
			var stat = fs.statSync(path);
		} catch (err) {
			// directory does not exist, good
		}
		
		if (stat) {
			var isEmpty = !fs.readdirSync(path).length;
			
			if (!isEmpty) {
				throw new Error('Directory \'' + name + '\' already exists and it is not empty.')
			}
		}
		
		if (!stat) {
			this.mkdir(path);
		}
		
		this.mkdir(path + '/bin');
		this.mkdir(path + '/lib');
		this.mkdir(path + '/commands');
		this.mkdir(path + '/test');
		
		var files = walk(__dirname + '/../skeleton/program');
		var index = 0;
		var file;
		
		while (file = files[index++]) {
			this.copy(file);
		}
		
		var self = this;
		
		this.invoke('npm install', function () {
			self.invoke('npm link');
		});
	},
	
	mkdir: function (path) {
		Logger.log('create', basename(path) + '/');
		fs.mkdirSync(path);
	},
	
	copy: function (srcPath) {
		var skeletonPath = __dirname + '/../skeleton/program';
		var filename = srcPath.replace(skeletonPath, '').replace('$name', this.name);
		var file = fs.readFileSync(srcPath, 'utf-8').replace(/\$name/g, this.name);
		
		Logger.log('create', filename.slice(1));
		fs.writeFileSync(this.path + filename, file, 'utf-8');
	},
	
	invoke: function (command, callback) {
		Logger.log('invoke', command);
		
		exec([
			'cd ' + this.path,
			command,
			'cd -'
		].join(' && '), callback);
	}
});