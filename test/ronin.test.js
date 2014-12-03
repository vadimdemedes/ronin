/**
 * Dependencies
 */

require('chai').should();
require('colorodo');

var Logger = require('../lib/logger');

var resolve = require('path').resolve;
var ronin = require('../');


/**
 * Tests
 */

describe ('Ronin', function () {
	describe ('Setup', function () {
		it ('should setup application with no arguments', function () {
			var program = ronin();

			program.path.should.equal(resolve(__dirname + '/../'));
			program.delimiter.should.equal(' ');
			program.name.should.equal('_mocha');
		});

		it ('should setup application with root path', function () {
			var program = ronin(__dirname);

			program.path.should.equal(__dirname);
			program.delimiter.should.equal(' ');
			program.name.should.equal('_mocha');
		});

		it ('should setup application with arguments', function () {
			var program = ronin({
				path: __dirname,
				delimiter: ':',
				name: 'hello-world'
			});

			program.path.should.equal(__dirname);
			program.delimiter.should.equal(':');
			program.name.should.equal('hello-world');
		});

		it ('should setup application with arguments using .set()', function () {
			var program = ronin();

			program.set({
				path: __dirname,
				delimiter: ':',
				name: 'hello-world'
			});

			program.path.should.equal(__dirname);
			program.delimiter.should.equal(':');
			program.name.should.equal('hello-world');
		});
	});
	
	describe ('Commands', function () {
		it ('should show root help', function () {
			var program = createProgram();
			
			var cases = [
				'node hello-world.js',
				'node hello-world.js -h',
				'node hello-world.js --help'
			];
			
			cases.forEach(function (args) {
				var stdout = outputStream();
				program.stdout = stdout;
				
				process.argv = args.split(' ');
				program.run();
				
				stdout.output.should.equal(
					'Usage: hello-world COMMAND [OPTIONS]\n\n' +
					'  Hello World application\n\n' +
					'Available commands:\n\n' +
					'apps              List applications\n' +
					'generate key      Generate new key\n' +
					'generate project  Generate new project\n'
				);
			});
		});
		
		it ('should show help for individual command', function () {
			var program = createProgram();
			
			var cases = [
				'node hello-world.js apps -h',
				'node hello-world.js apps --help'
			];
			
			cases.forEach(function (args) {
				var stdout = outputStream();
				program.stdout = stdout;
				
				process.argv = args.split(' ');
				program.run();
				
				stdout.output.should.equal(
					'Usage: hello-world apps [OPTIONS]\n\n' +
					'  List applications\n\n' +
					'Additional commands:\n\n' +
					'apps add      Add application\n' +
					'apps edit     Edit application\n' +
					'apps destroy  Destroy application\n'
				);
			});
		});
		
		it ('should execute command with no arguments', function () {
			var stdout = outputStream();
			var program = createProgram();
			program.stdout = stdout;
			
			process.argv = 'node hello-world.js apps'.split(' ');
			program.run();
			
			stdout.output.should.equal('apps\n');
		});
		
		it ('should execute command and show error', function () {
			var stdout = outputStream();
			var program = createProgram();
			Logger.stderr = stdout;
			
			process.argv = 'node hello-world.js generate key some-key'.split(' ');
			program.run();
			
			stdout.output.should.equal(
				'error'.color('red') + '\tgenerate key some-key\n'
			);
		});
		
		it ('should execute command with an option and argument', function () {
			var program = createProgram();
			
			var cases = [
				'node hello-world.js apps add --stack cedar some-app',
				'node hello-world.js apps add some-app --stack cedar'
			];
			
			cases.forEach(function (args) {
				var stdout = outputStream();
				program.stdout = stdout;
				
				process.argv = args.split(' ');
				program.run();
				
				stdout.output.should.equal('apps add cedar some-app\n');
			});
		});
		
		it ('should execute command with an alias option and argument', function () {
			var program = createProgram();
			
			var cases = [
				'node hello-world.js apps destroy some-app --force',
				'node hello-world.js apps destroy some-app --force true',
				'node hello-world.js apps destroy --force some-app'
			];
			
			cases.forEach(function (args) {
				var stdout = outputStream();
				program.stdout = stdout;
				
				process.argv = args.split(' ');
				program.run();
				
				stdout.output.should.equal('apps destroy some-app true\n');
			});
		});
		
		it ('should execute command with a global option', function () {
		  var program = createProgram();
		  
		  var cases = [
		    'node hello-world.js generate project hello --verbose --app world',
		    'node hello-world.js generate project hello -a world --verbose',
		    'node hello-world.js generate project hello --app world --verbose'
		  ];
		  
		  cases.forEach(function (args) {
		    var stdout = outputStream();
		    program.stdout = stdout;
		    
		    process.argv = args.split(' ');
		    program.run();
		    
		    stdout.output.should.equal('generate project hello true world world\n');
		  });
		});
	});
	
	describe ('Middleware', function () {
		it ('should execute middleware', function (done) {
			var stdout = outputStream();
			var program = createProgram();
			program.stdout = stdout;
			
			process.argv = 'node hello-world.js apps edit some-app'.split(' ');
			program.run();
			
			setTimeout(function () {
				stdout.output.should.equal(
					'auth some-app\n' +
					'beforeRun some-app\n' +
					'apps edit some-app\n'
				);
				
				done();
			}, 1000);
		});
	});
});

function createProgram () {
	return ronin({
		path: __dirname + '/fixtures/hello-world',
		name: 'hello-world',
		desc: 'Hello World application',
		options: {
		  app: {
		    type: 'string',
		    alias: 'a'
		  }
		}
	});
}

function outputStream () {
	var stdout = require('stream').Writable();
	stdout.output = '';
	stdout._write = function (chunk, encoding, next) {
		stdout.output += chunk;
		next();
	};
	
	return stdout;
}