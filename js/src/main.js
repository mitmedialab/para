/* Filename: main.js */

require.config({

    baseUrl: "js/src",

    paths : {
        "jquery" : "../../bower_components/jquery/dist/jquery",
        "paper" : "../../bower_components/paper/dist/paper-full",
        "backbone" : "../../bower_components/backbone/backbone",
        "underscore" : "../../bower_components/underscore/underscore",
        "handlebars"  : "../../bower_components/handlebars/handlebars",
        "toolbox": "../../bower_components/js-toolbox/toolbox",
        "tinycolor": "../../bower_components/tinycolor/tinycolor",
        "pickacolor": "../../bower_components/pick-a-color/build/1.2.4/js/pick-a-color-1.2.4.min",
        "filesaver": "../../bower_components/FileSaver/FileSaver",
        "slider": "../../bower_components/bootstrap-slider/js/bootstrap-slider"
    },
    
    shim: {

        "handlebars": {
            exports: "Handlebars"
        },

        "toolbox": {
            exports: "Toolbox"
        },
                
        "pickacolor": {
            deps: ["tinycolor", "jquery"],
            exports: "Pickacolor"
        }
               
    }
});

require(["app"], function (App) {
    App.initialize();
});
