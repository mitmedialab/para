/*PolygonNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'paper',
  'models/data/geometry/PathNode',


], function(_, paper, PathNode) {
  //drawable paper.js path object that is stored in the pathnode
  var PolygonNode = PathNode.extend({

    defaults: _.extend({}, PathNode.prototype.defaults, {
      name: 'polygon',
      userParams: null
    }),

    initialize: function(data) {
      PathNode.prototype.initialize.apply(this, arguments);
      this.set('userParams', [{
        label: 'points',
        max: 15,
        min: 3,
        v: 6,
        property_name: 'point_num'
      }]);
    },

    normalizeGeometry: function(path, matrix) {
      var userParams = this.get('userParams');
      userParams[0].val = path.segments.length;
      this.set('userParams', userParams);
      var data = PathNode.prototype.normalizeGeometry.apply(this, arguments);
      return data;
    },

    //called when path points are modified 
    updateParams: function(data) {
      console.log('calling update params', data);
      var proto_node = this.get('proto_node');
      if (proto_node) {
        proto_node.updateParams(data);
      } else {
        if (data.property_name == 'point_num') {
          var userParams = this.get('userParams');
          userParams[0].val = data.value;
          this.set('userParams', userParams);

          var radius = this.get('width') / 2;
          var path = new paper.Path.RegularPolygon(new paper.Point(0, 0), data.value, radius);
          path.position = new paper.Point(0,0);
          path.fillColor = this.get('geom').fillColor;
          path.strokeColor = this.get('geom').strokeColor;
          this.changeGeomInheritance(path);
          path.visible = false;
          this.transformSelf();
          this.trigger('modified',this);
        }
      }
    }

  });

  return PolygonNode;
});