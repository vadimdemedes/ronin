module.exports = function (next) {
	this.program.stdout.write('auth\n');
	
	setTimeout(next, 500);
};