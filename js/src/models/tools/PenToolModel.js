/*PenToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',
  'models/behaviors/ParentBehavior',
  'models/behaviors/FollowPathBehavior',
  'models/behaviors/ScaleBehavior'

], function(_, Backbone, BaseToolModel, PathNode,ParentBehavior, FollowPathBehavior,ScaleBehavior) {
  
  //types for bezier tool behavior
  var types = ['point', 'handleIn', 'handleOut'];

  //segment being drawn, mode of current drawing, type
  var currentSegment, mode, type;


  var PenToolModel = BaseToolModel.extend({
  	  defaults:_.extend({},BaseToolModel.prototype.defaults,  {
          }),

  	initialize: function(){

  	},

    reset: function(){
      currenSegment = null;
      this.currentPath = null;
    },

//method to determine location of handle for current segment
    findHandle: function(point) {
     // console.log('searching for handle');
      for (var i = 0, l = this.currentPath.getPath().segments.length; i < l; i++) {
        for (var j = 0; j < 3; j++) {
          var _type = types[j];
          var segment = this.currentPath.getPath().segments[i];
          var segmentPoint;
         if(type == 'point'){
             segmentPoint = segment.point;
            }
          else{
              segmentPoint = segment.point.add(segment[type]);

            }
          //console.log('segment.point='+segment.point);

          var distance = (point.subtract(segmentPoint)).length;
          // console.log('distance='+segment.point);
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

        //console.log('pen tool mouse down');
         if (currentSegment){
            currentSegment.selected = false;
          }
          mode = type = currentSegment = null;
          

          if (!this.currentPath) {
            this.currentPath = new PathNode({name:'path1'});

            var scaleBehavior  = new ScaleBehavior();
            var followPathBehavior = new FollowPathBehavior();
            var parentBehavior = new ParentBehavior();
            //scaleBehavior.addCondition('instance.position.y >250');
            //scaleBehavior.addCondition('instance.position.x >250');


           //this.currentPath.extendBehavior(scaleBehavior,'update');
            this.currentPath.extendBehavior(followPathBehavior,'setup');
            this.currentPath.extendBehavior(followPathBehavior,'update');
            this.currentPath.extendBehavior(parentBehavior,'setup');

            
            this.trigger('shapeAdded',this.currentPath);

          }

          var result = this.findHandle(event.point);
          //console.log('handle result='+result);
          if (result) {
            //console.log('found result='+result);

            currentSegment = result.segment;
            type = result.type;
            if (this.currentPath.getPath().segments.length > 1 && result.type === 'point' && result.segment.index === 0) {
              mode = 'close';
              //console.log('path is closed');
              this.currentPath.getPath().closed = true;
              this.currentPath.getPath().selected = false;
              this.currentPath = null;
            }
          }
          //console.log('after result='+result);

        if (mode != 'close') {
          mode = currentSegment ? 'move' : 'add';
          if (!currentSegment){
            currentSegment = this.currentPath.getPath().add(event.point);
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
        //console.log("trying to add handle to current segment");
      }

     },

     //mouse move event
     mouseMove: function(event){

     }




  });

  return PenToolModel;

});