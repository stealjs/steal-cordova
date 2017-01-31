function Platform(stealCordova, platform) {
	this.stealCordova = stealCordova;
	this.platform = platform;

	this.emulate = this.emulate.bind(this);
}

Platform.prototype.emulate = function(opts){
		return this.stealCordova.runCli(opts, {
			command: "emulate",
			platforms: [this.platform]
		});
};

module.exports = Platform;
