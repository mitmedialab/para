/*PenToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'paper',
  'models/tools/BaseToolModel',


], function(_, Backbone, paper, BaseToolModel) {
  
  //types for bezier tool behavior
  var types = ['point', 'handleIn', 'handleOut'];
  var nameVal = 0;
  //segment being drawn, mode of current drawing, type
  var currentSegment, mode, type;

  var eventType = 'shapeAdded';

  var PenToolModel = BaseToolModel.extend({
  	  defaults:_.extend({},BaseToolModel.prototype.defaults,  {
      }),

   
  	initialize: function(){
      BaseToolModel.prototype.initialize.apply(this, arguments);
      var paper = this.get('paper');
      this.reset();
  	},

    reset: function(){
      ////console.log('pen tool is reset');
      this.trigger('rootChange',true);
      currentSegment = null;
      if(this.currentPath){
      this.currentPath.selected = false;
        
        var pathNode  = new PathNode();
          pathNode.name = "Path_"+nameVal;
            nameVal++;
        pathNode.createInstanceFromPath(this.currentPath.clone());
        this.trigger('nodeAdded',pathNode);
         this.trigger('rootUpdate');
        this.trigger('rootRender');

       
      
        this.currentPath.remove();
        this.currentPath = null;
      }
       
        this.trigger('rootChange',false);
      this.trigger('rootRender');


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
                       

          this.currentPath =  new paper.Path();
    
         this.currentPath.selected = true;
    
         if(this.fillColor==-1){
          this.currentPath.style.fillColor = null;

         }
         if(this.strokeColor==-1){
          this.currentPath.style.strokeColor = null;

         }
         
         


          }

          var result = this.findHandle(event.point);
          
          if (result) {
            currentSegment = result.segment;
            type = result.type;
            if (this.currentPath.segments.length > 1 && result.type === 'point' && result.segment.index === 0) {
              mode = 'close';
             
              this.currentPath.closed = true;
              this.reset();
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