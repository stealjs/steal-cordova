# steal-cordova

Develop your project as a web application and then simply use steal-cordova to create Android and iOS Cordova apps.

## Install

```js
npm install steal-cordova --save-dev
```

## Example

steal-cordova needs a [BuildResult](http://stealjs.com/docs/steal-tools.BuildResult.html) object which you get from running StealTools multi-build:

```js
var stealTools = require("steal-tools");

var cordovaOptions = {
  path: "./build/cordova",
  id: "com.hello.world",
  name: "HelloWorld",
  platforms: ["ios", "android"]
  index: __dirname + "/index.html"
};

var stealCordova = require("steal-cordova")(cordovaOptions);

var buildPromise = stealTools.build({
  config: __dirname + "/package.json!npm"
});

buildPromise.then(stealCordova.build);
```

## Configuration

## API
