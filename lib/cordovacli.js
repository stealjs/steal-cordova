/*
 * grunt-cordovacli
 * https://github.com/csantana23/grunt-cordovacli
 *
 * Copyright (c) 2013 Carlos Santana
 * Licensed under the Apache-2.0 license.
 */
/*global module */
var path = require('path'),
    os   = require('os'),
    fs   = require('fs'),
    extend = require('xtend'),
    async = require('async'),
    spawn = require('child_process').spawn,
    mkdirp = require("mkdirp"),
    log = console.error.bind(console);


module.exports = function () {
    'use strict';

    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks

    var runCordova,
        runCordovaParallel,
        runCordovaSeries,
        runFullCycle,
        runCreate,
        runPlatform,
        runPlugin,
        isPlatformExists,
        cordova_path,
        cordova_json,
        cordova_pkg,
        cordova_bin,
        cordova_cli,
        cordova_plugins_map = {
            'battery-status':      'org.apache.cordova.battery-status',
            'camera':              'org.apache.cordova.camera',
            'console':             'org.apache.cordova.console',
            'contacts':            'org.apache.cordova.contacts',
            'device':              'org.apache.cordova.device',
            'device-motion':       'org.apache.cordova.device-motion',
            'device-orientation':  'org.apache.cordova.device-orientation',
            'dialogs':             'org.apache.cordova.dialogs',
            'file':                'org.apache.cordova.file',
            'file-transfer':       'org.apache.cordova.file-transfer',
            'geolocation':         'org.apache.cordova.geolocation',
            'globalization':       'org.apache.cordova.globalization',
            'inappbrowser':        'org.apache.cordova.inappbrowser',
            'media':               'org.apache.cordova.media',
            'media-capture':       'org.apache.cordova.media-capture',
            'network-information': 'org.apache.cordova.network-information',
            'splashscreen':        'org.apache.cordova.splashscreen',
            'vibration':           'org.apache.cordova.vibration'
        },
        validPlatforms = [
            'ios',
            'android',
            'ubuntu',
            'amazon-fireos',
            'wp8',
            'blackberry10',
            'firefoxos',
            'windows8',
            'windows',
            'browser'];
    runCordova = function (args, opts, done) {
        var cordova_cli, spawn_cmd;

        cordova_cli = path.join(cordova_path, cordova_bin);
        //opts.stdio = 'inherit';
        spawn_cmd = {
                "cmd": cordova_cli,
                "args": args,
                "opts": opts
        };

        if (os.platform() === 'win32') {
            spawn_cmd.cmd = 'node';
            spawn_cmd.args = [cordova_cli].concat(args);
        }

        debugger;

        log('Running:' + spawn_cmd.cmd + ' ' + spawn_cmd.args.join(' '));
        var child = spawn(spawn_cmd.cmd, spawn_cmd.args, spawn_cmd.opts);
        var logCli = function(d){
          log(d+"");
        };
        child.stdout.on('data', logCli);
        child.stderr.on('data', logCli);
        child.on('close',
            function (err) {
                if (false) {
                  // Reject
                    //grunt.log.error(err);
                } else {
                    log('Done-> cordova ' + args.join(' '));
                }
                done(err);
            }
        );
    };
    runCordovaParallel = function (tasks, done) {
        async.parallel(tasks, function (err, result) {
            if (err) {
                log('Error-> with Parallel tasks' + err);
                done(false);
            } else {
                log('Success-> with Parallel tasks');
                done();
            }
        });
    };
    runCordovaSeries = function (tasks, done) {
        async.series(tasks, function (err, result) {
            if (err) {
                log('Error-> with Series tasks' + err);
                done(false);
            } else {
                log('Success-> with Series tasks');
                done();
            }
        });
    };

    runCreate = function (options, done) {
        // cordova create <PATH> [ID] [NAME]
        var args = ['create', options.path, options.id, options.name].concat(options.args);
        if(options.path) {
		  mkdirp(options.path, function(err){
			if(err) return done(err);
            runCordova(args, {}, done);
          });
        } else {
          runCordova(args, {}, done);
        }
    };

    isPlatformExists = function (p, cordovaRootPath) {
        var platform_name;
        var platform_cdv_dir;
        var platform_src_dir;
        var pkg;
        // valid platform is like android or android@3.7.0
        platform_name = p.split('@')[0];
        if(validPlatforms.indexOf(p) === -1){
            //then a directory is passed, let's check what platform it is
            platform_src_dir = path.resolve(cordovaRootPath,p);
            try {
                pkg = require(path.join(platform_src_dir, 'package'));
                platform_name = pkg.name.split('-')[1];
            } catch(err){
                log("For some reason can't read platform package.json");
            }
        }
        //let check if platform is already added
        platform_cdv_dir = path.resolve(cordovaRootPath, 'platforms', platform_name);
        if (fs.existsSync(platform_cdv_dir)) {
            return platform_name;
        } else {
            return false;
        }

    };

    runPlatform = function (options, done) {
        //platform(s) [{add|remove|rm} <PLATFORM>]
            var tasks = [];
            tasks.length = 0;
            options.platforms.forEach(function (p) {
                var f;
                var skip = false;
                var platform_name;

                if(options.action === 'add'){
                    platform_name = isPlatformExists(p,options.path);
                    if(platform_name){
                        skip = true;
                        log('Platform '+platform_name+' already exists skipping add');
                    }
                }
                if(!skip){
                   f = function (callback) {
                        runCordova(['platform', options.action, p ].concat(options.args), {cwd:options.path}, callback);
                    };
                    tasks.push(f);
                }
            });
            if ( cordova_cli === 'cca'){
                runCordovaSeries(tasks, done);
            } else {
                runCordovaParallel(tasks, done);
            }

    };

    runPlugin = function (options, done) {
        //plugin(s) [{add|remove|rm} <PATH|URI>]
            var tasks = [];
            tasks.length = 0;

            if(Array.isArray(options.plugins)){
                options.plugins = [options.plugins];
            }

            options.plugins.forEach(function (p) {
                var f;
                var skip = false;
                var plugin_id;
                if(cordova_plugins_map[p]){
                    p = cordova_plugins_map[p];
                }

                f = function (callback) {
                    runCordova(['plugin', options.action, p ].concat(options.args), {cwd:options.path}, callback);
                };
                tasks.push(f);


            });
            runCordovaSeries(tasks, done);
    };

    runFullCycle = function (commands, options, done){
        var tasks = [];
        commands.forEach(function(command){
            if(command === 'create'){
                tasks.push(function (cb){runCreate(options,cb);});
            } else if (command === 'platform'){
                options.action = 'add';
                tasks.push(function (cb){runPlatform(options,cb);});
            } else if (command === 'plugin' && options.plugins){
                options.action = 'add';
                tasks.push(function (cb){runPlugin(options,cb);});
            } else if (command === 'prepare' || command === 'compile' || command === 'build'){
                tasks.push(function (cb){runCordova([command].concat(options.args), {cwd:options.path}, cb);});
            }
        });
        runCordovaSeries(tasks,done);
    };

    return function (opts) {

      return new Promise(function(resolve){

    // Merge task-specific and/or target-specific options with these defaults.
        var options = extend({}, {
                path: 'HelloCordova',
                name: 'HelloCordova',
                id: 'io.cordova.hellocordova',
                cli: 'cordova',
                args: []
            }, opts),
            done = resolve,
            msg = '',
            args = [],
            cmd_opts =  {},
            tasks = [],
            i,
            cordova_relative_path;
            cordova_cli = options.cli

            if ( cordova_cli === 'cca'){
                cordova_relative_path = '..';
            } else {
                cordova_relative_path = '';
            }

        cordova_path = path.join(path.dirname(require.resolve(options.cli)),cordova_relative_path);
        cordova_json = path.join(cordova_path,'package.json');
        cordova_pkg = require(cordova_json);
        cordova_bin = cordova_pkg.bin[Object.keys(cordova_pkg.bin)[0]];

        log('Using '+cordova_cli+' CLI version (' + cordova_pkg.version + ') ');

        if (Array.isArray(options.command)){
            // full cordova lifecycle
            return runFullCycle(options.command,options, done);
        }
        if (options.command !== "create") {
            log('Setting Current Working Directory (CWD) to ' + options.path);
            cmd_opts.cwd = options.path;
        }
        if (options.command === "create") {
            return runCreate(options,done);
        } else if (options.command === "platform") {
            return runPlatform(options, done);
        } else if (options.command === "plugin") {
            return runPlugin(options, done);
        } else {
            if (options.platforms) {
                tasks = [];
                tasks.length = 0;
                options.platforms.forEach(function (p) {
                    var f;
                    f = function (callback) {
                        if (options.command === "serve" && options.port) {
                            runCordova([options.command, p, options.port].concat(options.args), cmd_opts, callback);
                        } else {
                            runCordova([options.command, p ].concat(options.args), cmd_opts, callback);
                        }

                    };
                    tasks.push(f);
                });
                runCordovaParallel(tasks, done);

            } else {
                args = [options.command];
                if (options.command === "serve" && options.port) {
                    args.push(options.port);
                }
                runCordova(args.concat(options.args), cmd_opts, done);
            }
        }
      });
    };
};
