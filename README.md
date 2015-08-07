[![npm version](https://badge.fury.io/js/steal-cordova.svg)](http://badge.fury.io/js/steal-cordova)

# steal-cordova

Develop your project as a web application and then simply use steal-cordova to create Android and iOS Cordova apps.

## Install

```shell
npm install steal-cordova --save-dev
```

If you are developing for android you also need to install the Android SDK and Ant. You have a lot of options on how to do this. If using OSX the easiest way is with Homebrew:

```shell
brew install android-sdk ant
```

After installing set the `ANDROID_HOME` environmental variable:

```shell
export ANDROID_HOME=/usr/local/opt/android-sdk
```

To make this permanent set it in your .bashrc or .zshrc or whatever shell you use.

## Example

steal-cordova needs a [BuildResult](http://stealjs.com/docs/steal-tools.BuildResult.html) object which you get from running StealTools multi-build:

```js
var stealTools = require("steal-tools");

var cordovaOptions = {
  buildDir: "./build/cordova",
  id: "com.hello.world",
  name: "HelloWorld",
  platforms: ["ios", "android"],
  index: __dirname + "/index.html"
};

var stealCordova = require("steal-cordova")(cordovaOptions);

var buildPromise = stealTools.build({
  config: __dirname + "/package.json!npm"
});

buildPromise.then(stealCordova.build);
```

## API

Pass in your Cordova options to steal-cordova to create a stealCordova object that can be used to run builds, start emulators and run on Android devices.

### stealCordova

```js
var stealCordova = require("steal-cordova")(cordovaOptions);
```

### stealCordova.build

`stealCordova.build(buildResult) -> Promise`

Pass a [BuildResult](http://stealjs.com/docs/steal-tools.BuildResult.html) object from StealTools' [multi build](http://stealjs.com/docs/steal-tools.build.html). Returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) that will resolve when the Cordova application has built.

### stealCordova.android.emulate

`stealCordova.android.emulate() -> Promise`

Call to start an Android emulator with your project. Returns a promise that will resolve when the application has booted.

### stealCordova.android.run

`stealCordova.android.run() -> Promise`

Run your application on an Android device. Device must be connected prior to running this command.

### stealCordova.ios.emulate

`stealCordova.ios.emulate() -> Promise`

Call to start an iOS emulator running your application. Promise will resolve after the application has booted.

## Configuration

### CordovaOptions

Supports same options as [node-webkit-builder](https://github.com/mllrsohn/node-webkit-builder), but at minimum needs:

#### buildDir

#### id

#### name

#### platforms

## License

MIT
