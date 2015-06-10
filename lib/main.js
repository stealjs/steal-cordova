var assert = require("assert");
var cli = require("./cordovacli")();
var Promise = require("es6-promise").Promise;
var extend = require("xtend");
var path = require("path");
var fs = require("fs-extra");
var asap = require("pdenodeify");
var copy = asap(fs.copy);

var slice = Array.prototype.slice;

module.exports = function(cordovaOptions) {
	var exports = {};

	exports.init = function(opts){
		return runCli(opts, {
			command: ["create", "platform", "plugin"]
		});
	};

	exports.initIfNeeded = function(opts){
		var buildPath = (opts && opts.path) || cordovaOptions.path;
		assert(!!buildPath, "Path needs to be provided");

		var p = path.resolve(buildPath);

		return new Promise(function(resolve){
			fs.exists(p, function(doesExist){
				if(doesExist) {
					resolve();
				} else {
					exports.init(opts).then(function() { resolve(); });
				}
			});
		});
	};

	exports.copyProductionFiles = function(bundlesPath){
		var index = path.resolve(cordovaOptions.index);
		var dest = path.resolve(cordovaOptions.path, "www/");

		var otherCopies = (cordovaOptions.copy || []).map(function(arr){
			return copy(arr[0], path.join(dest, arr[1]));
		});

		return Promise.all([
			// copy the index.html file
			copy(index, path.join(dest, "index.html")),

			// Copy the dist folder
			copy(bundlesPath, path.join(dest,
																	path.relative(process.cwd(), bundlesPath)))
		].concat(otherCopies));
	};

	exports.platform = function(opts){
		return runCli(opts, {
			command: ["platform"]
		});
	};

	exports.build = function(buildOutput){
		return exports.initIfNeeded().then(function(){

			var bundlesPath = buildOutput.configuration.bundlesPath;
			return exports.copyProductionFiles(bundlesPath);

			return runCli(opts, {
				command: ["build"],
				args: ["--release"]
			});
		});
	};

	exports.android = {
		emulate: function(opts){
			return runCli(opts, {
				command: "emulate",
				platforms: ["android"]
			});
		},
		run: function(opts){

		}
	};

	exports.ios = {
		emulate: function(opts){
			return runCli(opts, {
				command: "emulate",
				platforms: ["ios"]
			});
		}
	};

	return exports;

	function runCli(/* opts */){
		var args = slice.call(arguments);
		args.unshift(cordovaOptions);
		args.unshift({});

		var opts = extend.apply(null, args);
		var promise = cli(opts);

		return promise;
	}

};
