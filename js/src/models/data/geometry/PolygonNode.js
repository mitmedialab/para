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

    initialize: function() {
      PathNode.prototype.initialize.apply(this, arguments);
      this.set('userParams', [{
        label: 'points',
        max: 15,
        min: 3,
        v: 6,
        property_name: 'point_num'
      }]);
    },

    Ï: function(path, matrix) {
      var userParams = this.get('userParams');
      userParams[0].val = path.segments.length;
      this.set('userParams', userParams);
      var data = PathNode.prototype.normalizeGeometry.apply(this, arguments);
      return data;
    },

    //called when path points are modified 
    updateParams: function(data) {
      if (data.property_name == 'point_num') {

        var proto_node = this.get('proto_node');
        if (proto_node) {
          proto_node.updateParams(data);
        } else {

          var userParams = this.get('userParams');
          userParams[0].val = data.value;
          this.set('userParams', userParams);

          var radius = this.get('width') / 2;
          var path = new paper.Path.RegularPolygon(new paper.Point(0, 0), data.value, radius);
          path.position = new paper.Point(0, 0);
          path.fillColor = this.get('geom').fillColor;
          path.strokeColor = this.get('geom').strokeColor;
          this.generatePoints(path, true);
          this.changeGeomInheritance(path);


          this.transformSelf();


          var inheritors = this.get('inheritors').inheritors;
        }
      }
      this.updateInheritorParams(data);

    },

    updateInheritorParams: function(data) {

      var inheritors = this.get('inheritors').inheritors;
      for (var i = 0; i < inheritors.length; i++) {
        var inheritor = inheritors[i];
        var userParams = inheritor.get('userParams');
        userParams[0].val = data.value;
        inheritor.set('userParams', userParams);

        var radius = inheritor.get('width') / 2;
        console.log('inheritor radius',radius)
        var path = new paper.Path.RegularPolygon(new paper.Point(0, 0), data.value, radius);
        path.position = new paper.Point(0, 0);
        path.fillColor = inheritor.get('geom').fillColor;
        path.strokeColor = inheritor.get('geom').strokeColor;
        inheritor.generatePoints(path, true);
        inheritor.changeGeomInheritance(path);
        inheritor.transformSelf();
      }
    }

  });

  return PolygonNode;
});