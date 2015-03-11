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
      userParams: null
    }),

    initialize: function(data) {
      PathNode.prototype.initialize.apply(this, arguments);
      this.set('userParams',[{
        label: 'points',
        max: 15,
        min: 3,
        val: 6,
        property_name: 'point_num'
      }]);
    },

    normalizeGeometry: function(path, matrix) {
      var userParams = this.get('userParams');
      userParams[0].val = path.segments.length;
      this.set('userParams',userParams);
      var data = PathNode.prototype.normalizeGeometry.apply(this,arguments);  
      return data;
    },

    //called when path points are modified 
    updateParams: function(data) {
      if(data.property_name=='point_num'){
         var userParams = this.get('userParams');
          userParams[0].val = data.value;
          this.set('userParams',userParams);

          var radius = this.get('width')/2;
          var new_master =new paper.Path.RegularPolygon(new paper.Point(0,0), data.value, radius);
          new_master.visible = false;
          this.set('master_path',new_master.exportJSON());
          new_master.remove();
      }
    }

  });

  return PolygonNode;
});
