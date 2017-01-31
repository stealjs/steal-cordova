var assert = require("assert");
var fse = require("fs-extra");
var exists = fse.existsSync;
var makeStealCordova = require("../lib/main");
var helpers = require("./helpers");

describe("steal-cordova", function(){
	beforeEach(function(done){
		fse.remove(__dirname + "/build", function(err){
			if(err) return done(err);
			done();
		});
	});

	it("works", function(done){
		var cordovaOptions = {
			buildDir: __dirname + "/build/cordova",
			id: "com.some.app",
			name: "some-app",
			platforms: ["ios"],
			plugins: ["cordova-plugin-transport-security"],
			index: __dirname + "/tests/app/production.html"
		};

		var stealCordova = makeStealCordova(cordovaOptions);
		helpers.shimRunCli(stealCordova, cordovaOptions);

		var buildResult = {
			configuration: {
				dest: __dirname + "/tests/app/dist"
			}
		};

		stealCordova.build(buildResult)
		.then(function(){
			assert(exists(__dirname + "/build/cordova/www/test/tests/app/dist/bundle.js"));
			assert(exists(__dirname + "/build/cordova/www/index.html"));
		})
		.then(done, done);
	});
});
