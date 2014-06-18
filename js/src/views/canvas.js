/* 
*canvas.js
*handles drawing into canvas
*/

define( function (require){
  "use strict";
  var paper = require("paper");
 var backbone = require("backbone");
 
    return {
        draw: function (canvas) {
            paper.setup(canvas);
  			var path = new paper.Path();
			// Give the stroke a color
			path.strokeColor = "black";
			var start = new paper.Point(100, 100);
			// Move to start and draw a line from there
			path.moveTo(start);
			// Note that the plus operator on Point objects does not work
			// in JavaScript. Instead, we need to call the add() function:
			path.lineTo(start.add([ 200, -50 ]));
			// Draw the view now:
			paper.view.draw();	

            return "drawing scene";

        }
    };
});

	
