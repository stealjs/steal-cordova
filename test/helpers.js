var fse = require("fs-extra");

exports.command = function(commands){
	var cmd = commands.command;
	return Array.isArray(cmd) ? cmd[0] : cmd;
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
	var runs = [];
	stealCordova.runCli = function(opts, commands){
		switch(exports.command(commands)) {
			case "create":
				runs.push(["create", commands.args, opts]);
				return exports.create(cordovaOptions.path);
			case "build":
				runs.push(["build", commands.args, opts]);
				return Promise.resolve();
			case "emulate":
				runs.push(["emulate", commands.args, opts]);
				return Promise.resolve();
		}
	};
	return runs;
};

exports.rmdir = function(){
	return new Promise(function(resolve, reject){
		fse.remove(__dirname + "/build", function(err){
			if(err) return reject(err);
			resolve();
		});
	});
}
