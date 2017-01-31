var asap = require("pdenodeify");
var assert = require("assert");
var cli = require("./cordovacli")();
var extend = require("xtend");
var fse = require("fs-extra");
var path = require("path");
var Platform = require("./platform");
var Promise = require("es6-promise").Promise;

var copy = asap(fse.copy);
var glob = asap(require("multi-glob").glob);
var slice = Array.prototype.slice;

function StealCordova(options) {
	this.options = options;

	var stealCordova = this;

	this.android = new Platform(this, "android");
	this.ios = new Platform(this, "ios");

	// Bind the public method so people can do
	// stealToolsBuild().then(stealCordova.build);
	this.build = this.build.bind(this);
}

StealCordova.prototype = {
	init: function(opts){
		return this.runCli(opts, {
			command: ["create", "platform", "plugin"]
		});
	},
	// Only initialize if it hasn't already been.
	initIfNeeded: function(opts){
		var buildPath = (opts && opts.path) || this.options.path;
		assert(!!buildPath, "Path needs to be provided");

		var p = path.resolve(buildPath);
		var stealCordova = this;

		return new Promise(function(resolve, reject){
			fse.exists(p, function(doesExist){
				if(doesExist) {
					resolve();
				} else {
					stealCordova.init(opts)
					.then(function() {
						resolve();
					})
					.catch(reject);
				}
			});
		});
	},
	copyProductionFiles: function(bundlesPath){
		var cordovaOptions = this.options;
		var index = path.resolve(cordovaOptions.index);
		var dest = path.resolve(cordovaOptions.path, "www/");

		var files = cordovaOptions.files || cordovaOptions.glob || [];
		files.unshift(bundlesPath);

		return glob(files).then(function(files){
			var copies = files.map(function(file){
				return copy(file, destPath(file));
			});
			// copy the index.html file
			copies.push(copy(index, path.join(dest, "index.html")));

			return Promise.all(copies);
		});


		function destPath(p){
			return path.join(dest, path.relative(process.cwd(), p));
		}
	},
	platform: function(opts){
		return this.runCli(opts, {
			command: ["platform"]
		});
	},
	build: function(buildResult){
		var stealCordova = this;
		return stealCordova.initIfNeeded().then(function(){
			var config = buildResult.configuration;
			var destPath = config.dest || config.bundlesPath;

			return stealCordova.copyProductionFiles(destPath);
		}).then(function(){
			return stealCordova.runCli({}, {
				command: ["build"],
				args: ["--release"]
			});
		});
	},
	runCli: function(/* opts */){
		var args = slice.call(arguments);
		args.unshift(this.options);
		args.unshift({});

		var opts = extend.apply(null, args);
		var promise = cli(opts);

		return promise;
	}
};

module.exports = StealCordova;
