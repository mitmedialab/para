/* main.js */

require.config({

    // Setup paths so our require.js text plugin can be resolved.
    baseUrl: "js/src",
    // Boost module timeout slightly for slower machines.
	paths : {   
        'jquery' : "../../bower_components/dist/jquery", //specific libraries -- can be specified later
        'paper' : "../../bower_components/paper/dist/paper-full"
    },
    
    shim: {
        'paper' : {
            exports: 'paper'
        },
    },
});

/**
 * **Main** Module
 * This module represents our application's entry point.
 */
 

define(function (require){
    //jQuery, canvas and the app/sub module are all
    //loaded and can be used here now.
    var canvas = require("views/canvas");
    var docCanvas = document.getElementById('canvas');
    console.log(canvas.draw(docCanvas));


    var SceneNode = require("models/SceneNode");
    var PathNode = require("models/PathNode");


     mySN = new SceneNode(null,"root");
     mySN2 = new SceneNode(mySN,"child");
     mySN3 = new PathNode(null,"subchild");

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
	/*paper.setup(canvas);
  var path = new paper.Path();
		// Give the stroke a color
		path.strokeColor = 'black';
		var start = new paper.Point(100, 100);
		// Move to start and draw a line from there
		path.moveTo(start);
		// Note that the plus operator on Point objects does not work
		// in JavaScript. Instead, we need to call the add() function:
		path.lineTo(start.add([ 200, -50 ]));
		// Draw the view now:
		paper.view.draw();	console.log(rect.size); // { width: 200, height: 100 }*/
});

