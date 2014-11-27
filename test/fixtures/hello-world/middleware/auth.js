module.exports = function (name, next) {
	this.program.stdout.write('auth ' + name + '\n');
	
	setTimeout(next, 500);
};