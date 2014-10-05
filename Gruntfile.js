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
            //paper: { src: "bower_components/paper/dist/paper-full.min.js", dest: "build/js/paper-full.min.js" },
            html: { src: "index-build.html", dest: "build/index.html" },
            images: { expand: true, cwd: "images", src: "**", dest: "build/images/" },
            fonts: { expand: true, cwd: "fonts", src: "**", dest: "build/fonts/" }
        },
        cssmin: {
            combine: {
                files: {
                    "build/style.css": [
                        "bower_components/bootstrap/dist/css/bootstrap.min.css",
                        "bower_components/pick-a-color/build/1.2.3/css/pick-a-color-1.2.3.min.css",
                        "css/basic.css"
                    ]
                }
            }
        },
        requirejs: {
            compile: {
                options: {
                    mainConfigFile: "js/src/main.js",
                    baseUrl: "js/src/",
                    paths : {
                        "jquery" : "empty:",
                        "backbone" : "empty:",
                        "underscore" : "empty:",
                        "handlebars"  : "empty:"
                    },
                    name: "app",
                    out: "build/js/app.js",
                    // optimize: "none",
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
        "test", "clean", "copy:html", "copy:images", "copy:fonts", "cssmin", "requirejs"
    ]);

    grunt.registerTask("default", ["test"]);

};
