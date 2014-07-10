/*PenToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode'

], function(_, Backbone, BaseToolModel, PathNode) {
  
  //types for bezier tool behavior
  var types = ['point', 'handleIn', 'handleOut'];
  var nameVal = 0;
  //segment being drawn, mode of current drawing, type
  var currentSegment, mode, type;


  var PenToolModel = BaseToolModel.extend({
  	  defaults:_.extend({},BaseToolModel.prototype.defaults,  {
          }),

   
  	initialize: function(){

  	},

    reset: function(){
      console.log('pen tool is reset');
      currentSegment = null;
      if(this.currentPath){
        this.currentNode.pathComplete();
        this.currentPath = null;
        this.currentNode = null;
      }
    },

//method to determine location of handle for current segment
    findHandle: function(point) {
      for (var i = 0, l = this.currentPath.segments.length; i < l; i++) {
        for (var j = 0; j < 3; j++) {
          var _type = types[j];
          var segment = this.currentPath.segments[i];
          var segmentPoint;
         if(type == 'point'){
             segmentPoint = segment.point;
            }
          else{
              segmentPoint = segment.point.add(segment[type]);

            }

          var distance = (point.subtract(segmentPoint)).length;
          if (distance < 3) {
            return {
              type: _type,
              segment: segment
            };
          }
        }
      }
      return null;
    },

      /*mousedown event- checks to see if current path has been initialized-
      *if it has not, create a new one and trigger a shapeAdded event
      */

      mouseDown : function(event) {
         if (currentSegment){
            currentSegment.selected = false;
          }
          mode = type = currentSegment = null;
          

          if (!this.currentPath) {
            this.currentNode  = new PathNode();
            this.currentNode.name = nameVal;
            nameVal++;
            this.currentPath = this.currentNode.path_literal;
            this.trigger('nodeAdded',this.currentNode);

          }

          var result = this.findHandle(event.point);
          
          if (result) {
            currentSegment = result.segment;
            type = result.type;
            if (this.currentPath.segments.length > 1 && result.type === 'point' && result.segment.index === 0) {
              mode = 'close';

              this.currentPath.closed = true;
              this.currentPath.selected = false;
              this.currentNode.pathComplete();
              this.currentPath = null;
              this.currentNode = null;
            }
          }

        if (mode != 'close') {
          mode = currentSegment ? 'move' : 'add';
          if (!currentSegment){
            currentSegment = this.currentPath.add(event.point);
          }
          currentSegment.selected = true;
        }
       },

     //mouse up event
     mouseUp : function(event) {
      
       },

     //mouse drag event - brokem
     mouseDrag: function(event){

      if (mode == 'move' && type == 'point') {
        currentSegment.point = event.point;
      } else if (mode != 'close') {
        var delta = event.delta.clone();
        if (type == 'handleOut' || mode == 'add'){
          delta = delta.negate();
        }
         currentSegment.handleIn = currentSegment.handleIn.add(delta);
        currentSegment.handleOut = currentSegment.handleOut.subtract(delta);
      }

     },

     //mouse move event
     mouseMove: function(event){

     }




  });

  return PenToolModel;

});