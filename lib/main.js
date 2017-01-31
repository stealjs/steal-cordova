var assert = require("assert");
var cli = require("./cordovacli")();
var Promise = require("es6-promise").Promise;
var extend = require("xtend");
var path = require("path");
var fs = require("fs-extra");
var asap = require("pdenodeify");
var copy = asap(fs.copy);
var glob = asap(require("multi-glob").glob);

var slice = Array.prototype.slice;

// Allow aliasing certain options to make consistent with steal-nw
var aliases = {
	buildDir: "path"
};

module.exports = function(cordovaOptions) {
	setAliases(cordovaOptions);

	var stealCordova = {};

	stealCordova.init = function(opts){
		return stealCordova.runCli(opts, {
			command: ["create", "platform", "plugin"]
		});
	};

	// Only initialize if it hasn't already been.
	stealCordova.initIfNeeded = function(opts){
		var buildPath = (opts && opts.path) || cordovaOptions.path;
		assert(!!buildPath, "Path needs to be provided");

		var p = path.resolve(buildPath);

		return new Promise(function(resolve, reject){
			fs.exists(p, function(doesExist){
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
	};

	stealCordova.copyProductionFiles = function(bundlesPath){
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
	};

	stealCordova.platform = function(opts){
		return stealCordova.runCli(opts, {
			command: ["platform"]
		});
	};

	stealCordova.build = function(buildResult){
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
	};

	stealCordova.android = {
		emulate: function(opts){
			return stealCordova.runCli(opts, {
				command: "emulate",
				platforms: ["android"]
			});
		},
		run: function(opts){

		}
	};

	stealCordova.ios = {
		emulate: function(opts){
			return stealCordova.runCli(opts, {
				command: "emulate",
				platforms: ["ios"]
			});
		}
	};

	stealCordova.runCli = function(/* opts */){
		var args = slice.call(arguments);
		args.unshift(cordovaOptions);
		args.unshift({});

		var opts = extend.apply(null, args);
		var promise = cli(opts);

		return promise;
	};

	return stealCordova;
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
