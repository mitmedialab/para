/*
 Copyright 2013 Daniel Wirtz <dcode@dcode.io>

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * JustMath.js Test Suite.
 * @author Daniel Wirtz <dcode@dcode.io>
 */

/**
 * File to use.
 * @type {string}
 */
var JUSTMATH_FILE = "../JustMath.min.js";

var JustMath = require(JUSTMATH_FILE);

/**
 * Constructs a new Sandbox for module loaders and shim testing.
 * @param {Object.<string,*>} properties Additional properties to set
 * @constructor
 */
var Sandbox = function(properties) {
    this.Math = Math;
    for (var i in properties) {
        this[i] = properties[i];
    }
    this.console = {
        log: function(s) {
            console.log(s);
        }
    };
};


/**
 * Test suite.
 * @type {Object.<string,function>}
 */
var suite = {

    setUp: function (callback) {
        callback();
    },
    tearDown: function (callback) {
        callback();
    },

    "commonjs": function(test) {
        var fs = require("fs")
            , vm = require("vm")
            , util = require('util');

        var code = fs.readFileSync(__dirname+"/"+JUSTMATH_FILE);
        var sandbox = new Sandbox({
            module: {
                exports: {}
            }
        });
        vm.runInNewContext(code, sandbox, "JustMath.js in CommonJS-VM");
        // console.log(util.inspect(sandbox));
        test.ok(typeof sandbox.module.exports == 'object');
        test.done();
    },

    "amd": function(test) {
        var fs = require("fs")
            , vm = require("vm")
            , util = require('util');

        var code = fs.readFileSync(__dirname+"/"+JUSTMATH_FILE);
        var sandbox = new Sandbox({
            require: function() {},
            define: (function() {
                function define() {
                    define.called = true;
                }
                define.amd = true;
                define.called = false;
                return define;
            })()
        });
        vm.runInNewContext(code, sandbox, "JustMath.js in AMD-VM");
        // console.log(util.inspect(sandbox));
        test.ok(sandbox.define.called == true);
        test.done();
    },

    "shim": function(test) {
        var fs = require("fs")
            , vm = require("vm")
            , util = require('util');

        var code = fs.readFileSync(__dirname+"/"+JUSTMATH_FILE);
        var sandbox = new Sandbox();
        vm.runInNewContext(code, sandbox, "JustMath.js in shim-VM");
        // console.log(util.inspect(sandbox));
        test.ok(typeof sandbox.dcodeIO != 'undefined' && typeof sandbox.dcodeIO.JustMath != 'undefined' && typeof sandbox.dcodeIO.JustMath.Vec2 == 'function')
        test.done();
    }
};

module.exports = suite;