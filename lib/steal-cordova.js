var asap = require("pdenodeify");
var assert = require("assert");
var cheerio = require("cheerio");
var cli = require("./cordovacli")();
var extend = require("xtend");
var fse = require("fs-extra");
var path = require("path");
var Platform = require("./platform");
var Promise = require("es6-promise").Promise;

var copy = asap(fse.copy);
var readFile = asap(fse.readFile);
var writeFile = asap(fse.writeFile);
var ensureFile = asap(fse.ensureFile);
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
		var stealCordova = this;
		var cordovaOptions = this.options;
		var dest = path.resolve(cordovaOptions.path, "www/");

		var files = cordovaOptions.files || cordovaOptions.glob || [];
		files.unshift(bundlesPath);

		return glob(files).then(function(files){
			var copies = files.map(function(file){
				return copy(file, destPath(file))
					.catch(function(error) {
						console.error('First attempt at copying', file,
							'failed because of', error, 'Trying again...');

						return copy(file, destPath(file));
					});
			});
			// copy the index.html file
			copies.push(stealCordova.copyIndexHTML(dest));

			return Promise.all(copies);
		});


		function destPath(p){
			return path.join(dest, path.relative(process.cwd(), p));
		}
	},
	copyIndexHTML: function(dest){
		var index = path.resolve(this.options.index);
		var indexDest = path.join(dest, "index.html");

		var readAndEnsure = Promise.all([
			readFile(index, "utf8"),
			ensureFile(indexDest)
		])
		.then(function(resolutions){
			// Set the steal script tag's "env" variable to cordova-production
			var txt = resolutions[0];
			var $ = cheerio.load(txt);
			var stealScript;
			$("script").each(function(idx, el){
				var $el = $(el);
				var src = $el.attr("src");
				if(/steal\.production\.js/.test(src)) {
					stealScript = $el;
					return false;
				}
			});

			if(stealScript) {
				stealScript.attr("env", "cordova-production");
				return writeFile(indexDest, $.html(), "utf8")
			} else {
				return copy(index, indexDest);
			}
		});
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
