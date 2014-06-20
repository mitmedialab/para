/*PathNode.js
* path object
* extends GeometryNode
*/


define([
  'underscore',
  'models/data/GeometryNode',
  'models/PaperManager',

], function(_, GeometryNode, PaperManager) {
  
  var PathNode = GeometryNode.extend({
     defaults: _.extend({},GeometryNode.prototype.defaults, {
           type: 'path',
        }),

    initialize: function(){
      //call the super constructor
      //GeometryNode.prototype.initialize.call(this);
      console.log('initializing path node');
      this.paper = PaperManager.getPaperInstance('path');
      this.path = new this.paper.Path();
      console.log('path stroke color='+this.get('strokeColor'));
      this.path.strokeColor = this.get('strokeColor');
    },

    addPoint: function(x,y){
      
      this.path.add(new this.paper.Point(x, y));
    },

    draw: function(){
      

    }



  });

  return PathNode;

});