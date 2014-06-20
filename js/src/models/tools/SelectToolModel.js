/*SelectToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',

], function(_, Backbone, BaseToolModel, PathNode) {
  var currentPath;

  var SelectToolModel = BaseToolModel.extend({
  	  defaults:_.extend({},BaseToolModel.prototype.defaults,  {
          }),

  	initialize: function(){
      
  	},

      /*mousedown event- checks to see if current path has been initialized-
      *if it has not, create a new one and trigger a shapeAdded event
      */
      mouseDown : function(event) {
        console.log("select tool mouse down");
          /*if (!currentPath) {
            currentPath = new PathNode({name:'path1'});
            this.trigger('change:shapeAdded');
        }*/
       // currentPath.addPoint(event.offsetX,event.offsetY);
      
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

  return SelectToolModel;

});