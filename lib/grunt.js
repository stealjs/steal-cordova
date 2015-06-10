var extend = require("xtend");

module.exports = Grunt;

function Grunt() {
	var self = this;
	this.done = new Promise(function(resolve){
		self.resolve = resolve;
	});
	this.log = { writeln: function(){} };
}

Grunt.prototype.registerMultiTask = function(name, desc, callback){
	this.callback = callback;
};

Grunt.prototype.options = function(opts){
	return extend({}, this._options, opts);
};

Grunt.prototype.async = function(){
	return function(){
		this.resolve();
	}.bind(this);
};

Grunt.prototype.run = function(options){
	this._options = options;
	this.callback();
	return this.done;
};
