/* Filename: main.js */

require.config({

    // Setup paths so our require.js text plugin can be resolved.
    baseUrl: "js/src",
    // Boost module timeout slightly for slower machines.
	paths : {   
        "jquery" : "../../bower_components/jquery/dist/jquery", //specific libraries -- can be specified later
        "paper" : "../../bower_components/paper/dist/paper-full",
        "backbone" : "../../bower_components/backbone/backbone",
        "underscore" : "../../bower_components/underscore/underscore",
        "mustache"  : "../../bower_components/mustache.js/mustache"
    },
    
    shim: {
        paper : {
            exports: "paper"
        },
        backbone: {
        deps: ["underscore", "jquery"],
        exports: "Backbone"
        },

        underscore: {
         exports: "_"
        }
    },
});

require([
  // Load our app module and pass it to our definition function
  "app",

], function(App){
  // The "app" dependency is passed in as "App"
  // Again, the other dependencies passed in are not "AMD" therefore don't pass a parameter to this function
  App.initialize();
});



