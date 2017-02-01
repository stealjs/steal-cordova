var fse = require("fs-extra");

exports.command = function(commands){
	var cmd = commands.command;
	return cmd && cmd[0];
};

exports.create = function(buildDir){
	return new Promise(function(resolve, reject){
		fse.ensureDir(buildDir, function(err){
			if(err) {
				reject(err);
			} else {
				resolve();
			}
		})
	});
};

exports.shimRunCli = function(stealCordova, cordovaOptions){
	stealCordova.runCli = function(opts, commands){
		switch(exports.command(commands)) {
			case "create":
				return exports.create(cordovaOptions.path);
			case "build":
				return Promise.resolve();
				break;
		}
	};
};

exports.rmdir = function(){
	return new Promise(function(resolve, reject){
		fse.remove(__dirname + "/build", function(err){
			if(err) return reject(err);
			resolve();
		});
	});
}
