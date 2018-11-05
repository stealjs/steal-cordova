function Platform(stealCordova, platform) {
	this.stealCordova = stealCordova;
	this.platform = platform;

	this.emulate = this.emulate.bind(this);
}

Platform.prototype.emulate = function(opts){
	var args = [];

	if(this.platform === "ios") {
		args.push("--buildFlag='-UseModernBuildSystem=0'");
	}

	return this.stealCordova.runCli(opts, {
		command: "emulate",
		platforms: [this.platform],
		args: args
	});
};

module.exports = Platform;
