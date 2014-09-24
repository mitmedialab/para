/*PolygonNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/PathNode',
  'models/data/Instance',
  'models/PaperManager'


], function(_, PathNode, Instance, PaperManager) {
  //drawable paper.js path object that is stored in the pathnode
  var paper = PaperManager.getPaperInstance();
  var PolygonNode = PathNode.extend({

    type: 'polygon',
    name: 'none',

     constructor: function() {

     PathNode.apply(this, arguments);

    },

    initialize: function(data) {
   
        PathNode.prototype.initialize.apply(this, arguments);
      },

   //called when path points are modified 
   updateSideNum: function(index, sideNum) {
      this.resetObjects();
      var newPath = this.masterPath;

      //update the path
      for(var j=0;j<this.instance_literals.length;j++){
          var instance = this.instance_literals[j];
          var rad = instance.bounds.width/2;
          var matrix = instance.data.tmatrix;

          var center = instance.position;
          instance.remove()
         var newInstance = new paper.Path.RegularPolygon(event.point,sideNum,rad);
          newInstance.data.tmatrix = matrix;
          this.instance_literals[j]= newInstance;

      }
    }

   });

  return PolygonNode;
});