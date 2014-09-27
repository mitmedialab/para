require.config({
    paths : {
        // Note: Paths must also be added to index-build.html
        // CDN paths must be added to the Gruntfile as "empty:"
        "jquery" : "../../bower_components/jquery/dist/jquery",
        "backbone" : "../../bower_components/backbone/backbone",
        "underscore" : "../../bower_components/underscore/underscore",
        "handlebars"  : "../../bower_components/handlebars/handlebars",
        "paper" : "../../bower_components/paper/dist/paper-full",
        "toolbox": "../../bower_components/js-toolbox/toolbox",
        "tinycolor": "../../bower_components/tinycolor/tinycolor",
        "pickacolor": "../../bower_components/pick-a-color/build/1.2.4/js/pick-a-color-1.2.4.min",
        "filesaver": "../../bower_components/FileSaver/FileSaver"
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

require(["jquery", "backbone", "underscore", "handlebars"], function () {
    require(["app"]);
});
