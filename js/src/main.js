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
        "filesaver": "../../bower_components/FileSaver/FileSaver",
        "backbone.undo": "../../bower_components/Backbone.Undo/Backbone.Undo",
         "jquery-ui" : "../../bower_components/jqueryui/jquery-ui.min",
        "iris-color-picker": "../../bower_components/iris-color-picker/dist/iris.min"
    },
  
    shim: {
        "handlebars": {
            exports: "Handlebars"
        },
        
        "toolbox": {
            exports: "Toolbox"
        },

        "iris-color-picker":{
            deps: ["jquery", "jquery-ui"],
            exports: "IrisColorPicker"
        }
    }

});

require(["jquery", "backbone", "underscore", "handlebars"], function () {
    require(["app"]);
});
