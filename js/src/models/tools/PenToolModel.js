/*PenToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',

], function(_, Backbone, BaseToolModel, PathNode) {
  

  var PenToolModel = BaseToolModel.extend({
  	  defaults:_.extend({},BaseToolModel.prototype.defaults,  {
          }),

  	initialize: function(){
      
  	},

      /*mousedown event- checks to see if current path has been initialized-
      *if it has not, create a new one and trigger a shapeAdded event
      */
      mouseDown : function(event) {
        console.log('pen tool mouse down');
          if (!this.currentPath) {
            this.currentPath = new PathNode({name:'path1'});
            this.trigger('change:shapeAdded',this.currentPath);
        }
        this.currentPath.addPoint(event.offsetX,event.offsetY);
      
       },

     //mouse up event
     mouseUp : function(event) {
      
       },

     //mouse drag event
     mouseDrag: function(event){

     },

     //mouse move event
     mouseMove: function(event){

     }




  });

  return PenToolModel;

});