/*SelectToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',
  'models/PaperManager'

], function(_, Backbone, BaseToolModel, PathNode, PaperManager) {
  var segment, path, paper;

    var hitOptions = {
      segments: true,
      stroke: true,
      fill: true,
      tolerance: 5
    };

  var SelectToolModel = BaseToolModel.extend({
  	  defaults:_.extend({},BaseToolModel.prototype.defaults,  {
          }),

  	initialize: function(){
        paper = PaperManager.getPaperInstance();
  	},

      /*mousedown event- checks to see if current path has been initialized-
      *if it has not, create a new one and trigger a shapeAdded event
      */
      mouseDown : function(event) {
        var paper = PaperManager.getPaperInstance();
       segment = path = null;
        var hitResult = paper.project.hitTest(event.point, hitOptions);

      if (event.modifiers.shift) {
        if (hitResult.type == 'segment') {
          hitResult.segment.remove();
        }
        return;
      }

      if (hitResult) {
        path = hitResult.item;
        if (hitResult.type == 'segment') {
          segment = hitResult.segment;
        } else if (hitResult.type == 'stroke') {
          var location = hitResult.location;
          //segment = path.insert(location.index + 1, event.point);
          //path.smooth();
        }
        //hitResult.item.bringToFront();
      }
      
       },
       
     //mouse up event
     mouseUp : function(event) {
      
       },

     //mouse drag event
     mouseDrag: function(event){
      console.log("tool mouse drag");
      if (segment) {
        console.log("dragging segment");
        segment.point = segment.point.add(event.delta);

        //path.smooth();
      } else if (path) {
         console.log("dragging path");
        path.position = path.position.add(event.delta);
      }
     },

     //mouse move event
     mouseMove: function(event){
        console.log("tool mouse move");
          var hitResult = paper.project.hitTest(event.point, hitOptions);
          paper.project.activeLayer.selected = false;
          if (hitResult && hitResult.item){
           hitResult.item.selected = true;
            
          if(path){
            path.nodeParent.checkIntersections();
          }
       }

     }




  });

  return SelectToolModel;

});