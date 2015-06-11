var stealTools = require("steal-tools");

var cordovaOptions = {
  path: "./build/cordova",
  id: "com.hello.world",
  name: "HelloWorld",
  platforms: ["ios", "android"],
  index: __dirname + "/index.html",
  copy: [
    ["node_modules/steal/steal.production.js", "steal.production.js"]
  ]
};

var stealCordova = require("../lib/main")(cordovaOptions);

var buildPromise = stealTools.build({
  config: __dirname + "/package.json!npm"
});

var cordovaPromise = buildPromise.then(stealCordova.build);

cordovaPromise.then(function(){
  console.log("cordovad")
	stealCordova.ios.emulate();
}, function(err){
  console.log("an err:", err);
});
