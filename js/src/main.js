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


/**
 * **Main** Module
 * This module represents our application's entry point.
 */
 

/*define(function (require){
    "use strict";
    //jQuery, canvas and the app/sub module are all
    //loaded and can be used here now.
    var canvas = require("views/canvas");
    var docCanvas = document.getElementById("canvas");
    console.log(canvas.draw(docCanvas));


    var SceneNode = require("models/SceneNode");
    var PathNode = require("models/PathNode");


     var mySN = new SceneNode(null,"root");
     var mySN2 = new SceneNode(mySN,"child");
    var  mySN3 = new PathNode(null,"subchild");

     console.log("adding child node="+mySN.addChildNode(mySN2));
    console.log("adding child node="+mySN2.addChildNode(mySN3));
    console.log(mySN3.getType());
    console.log(mySN2.getType());
    console.log(mySN3.getName());
     console.log("parent is: "+mySN3.getParentNode().name);
     console.log(mySN.getChildren());
     //console.log("rremoving child node="+mySN.recursiveRemoveChildNode(mySN3));
     mySN.update();
     //mySN2.clearAll();
     //console.log(mySN);

    //var canvas = document.getElementById('canvas');
	// Create an empty project and a view for the canvas:

});*/

