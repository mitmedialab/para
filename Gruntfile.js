/* jshint browser: false, node: true */

module.exports = function (grunt) {
    "use strict";

    grunt.initConfig({
        jshint : {
            options : {
                jshintrc : true
            },
            all : [
                "bower.json",
                "package.json",
                "*.js",
                // "js/**/*.js",
                "server/**/*.js"
            ]
        },
        jscs: {
            src: "<%= jshint.all %>",
            options: {
                config: ".jscsrc"
            }
        },

        clean: ["./build"],
        copy: {
            html: { src: "index-build.html", dest: "build/index.html" },
            images: { expand: true, cwd: "images", src: "**", dest: "build/images/" },
            fonts: { expand: true, cwd: "fonts", src: "**", dest: "build/fonts/" }
        },
        cssmin: {
            combine: {
                files: {
                    "build/style.css": ["css/basic.css"]
                }
            }
        },
        requirejs: {
            compile: {
                options: {
                    paths: { "requirejs" : "../../bower_components/requirejs/require" },
                    include : "requirejs",
                    insertRequire : ["app"],
                    mainConfigFile: "js/src/config.js",
                    baseUrl: "js/src/",
                    name: "app",
                    out: "build/js/para.js",
                    // optimize: "none",
                    wrapShim: true,
                    useStrict: true
                }
            }
        }

    });

    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-jscs");

    grunt.loadNpmTasks("grunt-contrib-clean");
    grunt.loadNpmTasks("grunt-contrib-copy");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-requirejs");

    grunt.registerTask("test", ["jshint", "jscs"]);

    grunt.registerTask("build", [
        "test", "clean", "copy", "cssmin", "requirejs"
    ]);

    grunt.registerTask("default", ["test"]);

};
