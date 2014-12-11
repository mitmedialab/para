/*PolygonNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'paper',
  'models/data/PathNode',


], function(_, paper, PathNode) {
  //drawable paper.js path object that is stored in the pathnode
  var PolygonNode = PathNode.extend({

  defaults: _.extend({}, PathNode.prototype.defaults, {
       name: 'polygon',
    
    }),
     constructor: function() {
      this.userParams = [{label:'points',max:15,min:3,propertyName:'pointNum'}];
      this.pointNum = 6;
      PathNode.apply(this, arguments);

    },

    initialize: function(data) {
        PathNode.prototype.initialize.apply(this, arguments);
      },


    

   //called when path points are modified 
   updateParams: function(sideNum) {
    /*console.log("update params to",sideNum);
      this.resetObjects();
      this.sideNum = sideNum;
      //update the path
      for(var j=0;j<this.instance_literals.length;j++){
         var instance = this.instance_literals[j];
          var rad = instance.bounds.width/2;
          var matrix = instance.data.tmatrix;

          var center = new paper.Point(0,0);
          console.log("center",center);
          console.log("rad",rad);
          var width = instance.bounds.width;
        instance.remove();
        instance = null;
        var newInstance = new paper.Path.RegularPolygon(center,sideNum,1);
        var scale = width/newInstance.bounds.width;
        newInstance.scale(scale);
        newInstance.reset= true;
         this.instance_literals[j] = newInstance;
        
          

      }*/
    }

   });

  return PolygonNode;
});