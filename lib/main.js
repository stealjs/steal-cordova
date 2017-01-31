var StealCordova = require("./steal-cordova");

// Allow aliasing certain options to make consistent with steal-nw
var aliases = {
	buildDir: "path"
};

function setAliases(options){
	Object.keys(aliases).forEach(function(alias){
		var opt = aliases[alias];

		if(options[alias]) {
			options[opt] = options[alias];
			delete options[alias];
		}
	});
}

module.exports = function(cordovaOptions) {
	setAliases(cordovaOptions);

	return new StealCordova(cordovaOptions);
};
