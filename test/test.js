var assert = require("assert");
var fse = require("fs-extra");
var exists = fse.existsSync;
var makeStealCordova = require("../lib/main");
var helpers = require("./helpers");
var cheerio = require("cheerio");

describe("steal-cordova", function(){
	var cliRuns;
	beforeEach(function(done){
		helpers.rmdir(__dirname + "/build")
		.then(function(){
			var cordovaOptions = {
				buildDir: __dirname + "/build/cordova",
				id: "com.some.app",
				name: "some-app",
				platforms: ["ios"],
				plugins: ["cordova-plugin-transport-security"],
				index: __dirname + "/tests/app/production.html"
			};

			var stealCordova = makeStealCordova(cordovaOptions);
			cliRuns = helpers.shimRunCli(stealCordova, cordovaOptions);

			var buildResult = {
				configuration: {
					dest: __dirname + "/tests/app/dist"
				}
			};

			stealCordova.build(buildResult)
			.then(function() {
				return stealCordova.ios.emulate();
			})
			.then(function(){
				done();
			}, done);
		});
	});

	it("Copies over the production files", function(){
		assert(exists(__dirname + "/build/cordova/www/test/tests/app/dist/bundle.js"));
		assert(exists(__dirname + "/build/cordova/www/index.html"));
	});

	it("Sets the Steal environment", function(){
		var txt = fse.readFileSync(__dirname + "/build/cordova/www/index.html", "utf8");
		var $ = cheerio.load(txt);

		var env = $("script").attr("env");
		assert.equal(env, "cordova-production", "Sets the proper Node env");
	});

	it("Sets --buildFlag='-UseModernBuildSystem=0' for the build", function() {
		assert.equal(cliRuns[1][1][1], "--buildFlag='-UseModernBuildSystem=0'");
		assert.equal(cliRuns[2][1][0], "--buildFlag='-UseModernBuildSystem=0'");
	});
});
