require.config({
    baseUrl : "js/src",

    paths : {
        "text": "../../bower_components/requirejs-text/text",
        "jquery" : "../../bower_components/jquery/dist/jquery",
        "backbone" : "../../bower_components/backbone/backbone",
        "underscore" : "../../bower_components/underscore/underscore",
        "handlebars"  : "../../bower_components/handlebars/handlebars.amd",
        "paper" : "../../bower_components/paper/dist/paper-full",
        "toolbox": "../../bower_components/js-toolbox/toolbox",
        "filesaver": "../../bower_components/FileSaver/FileSaver",
        "backbone.undo": "../../bower_components/Backbone.Undo/Backbone.Undo",
        "jquery-ui" : "../../bower_components/jqueryui/jquery-ui",
        "iris-color-picker": "../../bower_components/iris-color-picker/dist/iris",
        "jquery-cookie" : "../../bower_components/jquery-cookie/jquery.cookie",
        "html": "../../html",
        "cjs": "../../bower_components/constraintjs/build/cjs.min" ,
        "fancytree": "../../bower_components/fancytree/dist/jquery.fancytree-all.min",
        "aws-sdk-js": "../../bower_components/aws-sdk-js/dist/aws-sdk.min",
        "canvas-toBlob": "../../bower_components/canvas-toBlob/canvas-toBlob"
    },
  
    shim: {       
        "toolbox": {
            exports: "Toolbox"
        },

        "aws-sdk-js": {
            exports: "AWS"
        },

        "cjs":{
            exports: "cjs",
            init: function(){
                return cjs.noConflict();
            }
        },
        "backbone.undo": {
            deps: ["backbone"]
        },
        "iris-color-picker":{
            deps: ["jquery", "jquery-ui"]
        },
        "fancytree":{
            deps: ["jquery", "jquery-ui"]
        }
    }
});
