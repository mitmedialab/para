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
            requirejs: { src: "bower_components/requirejs/require.js", dest: "build/js/require.js" },
            html: { src: "index-build.html", dest: "build/index.html" },
            images: { expand: true, cwd: "images", src: "**", dest: "build/images/" }
        },
        cssmin: {
            combine: {
                files: {
                    "build/style.css": [
                        "bower_components/bootstrap/dist/css/bootstrap.min.css",
                        "bower_components/pick-a-color/build/1.2.3/css/pick-a-color-1.2.3.min.css",
                        "bower_components/bootstrap-slider/css/bootstrap-slider.css",
                        "css/basic.css"
                    ]
                }
            }
        },
        requirejs: {
            compile: {
                options: {
                    baseUrl: "js/src/",
                    mainConfigFile: "js/src/main.js",
                    name: "main",
                    out: "build/js/main.js",
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
        "test", "clean", "copy:requirejs", "copy:html", "copy:images", "cssmin", "requirejs"
    ]);

    grunt.registerTask("default", ["test"]);

};
