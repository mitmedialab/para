/*PenToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',
  'models/PaperManager'

], function(_, Backbone, BaseToolModel, PathNode, PaperManager) {
  
  //types for bezier tool behavior
  var types = ['point', 'handleIn', 'handleOut'];
  var currentSegment, mode, type;
  var PenToolModel = BaseToolModel.extend({
  	  defaults:_.extend({},BaseToolModel.prototype.defaults,  {
          }),

  	initialize: function(){

  	},

    findHandle: function(point) {
      console.log('searching for handle');
      for (var i = 0, l = this.currentPath.path.segments.length; i < l; i++) {
        for (var j = 0; j < 3; j++) {
          var type = types[j];
          var segment = this.currentPath.path.segments[i];
          var segmentPoint;
         if(type == 'point'){
             segmentPoint = segment.point;
            }
          else{
              segmentPoint = segment.point + segment[type];

            }
          console.log('segment.point='+segment.point);

          var distance = (point - segmentPoint).length;
           console.log('distance='+segment.point);
          if (distance < 3) {
            return {
              type: type,
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
            this.currentPath.path.selected = true;
            this.currentPath.path.fillColor = {
                hue: 360 * Math.random(),
                saturation: 1,
                brightness: 1,
                alpha: 0.5
              }
            //this.trigger('change:shapeAdded',this.currentPath);

          }

          var result = this.findHandle(event.point);
          console.log('handle result='+result);
          if (result) {
            //console.log('found result='+result);

            currentSegment = result.segment;
            type = result.type;
            if (this.currentPath.path.segments.length > 1 && result.type === 'point' && result.segment.index === 0) {
              mode = 'close';
              this.currentPath.path.closed = true;
              this.currentPath.path.selected = false;
              this.currentPath.path = null;
            }
          }
          //console.log('after result='+result);

        if (mode != 'close') {
          mode = currentSegment ? 'move' : 'add';
          if (!currentSegment){
            currentSegment = this.currentPath.path.add(event.point);
          }
          currentSegment.selected = true;
        }
       },

     //mouse up event
     mouseUp : function(event) {
      
       },

     //mouse drag event - brokem
     mouseDrag: function(event){
      /*console.log("mouseDrag delta="+event.delta);
      if (mode == 'move' && type == 'point') {
        currentSegment.point = event.point;
      } else if (mode != 'close') {
        var delta = event.delta.clone();
        if (type == 'handleOut' || mode == 'add'){
          delta = -delta;
        }
        currentSegment.handleIn += delta;
        currentSegment.handleOut -= delta;
        console.log("trying to add handle to current segment");
      }*/

     },

     //mouse move event
     mouseMove: function(event){

     }




  });

  return PenToolModel;

});