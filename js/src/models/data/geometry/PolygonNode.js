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

    normalizeGeometry: function(path, matrix) {
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
          var toggleClosed = false;
          if (this.nodeParent && this.nodeParent.get('name') === 'group' && !this.nodeParent.get('open')) {
            this.nodeParent.toggleOpen(this.nodeParent);
            toggleClosed = true;
          }
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

          path.visible = false;

          this.transformSelf();
          if (toggleClosed) {
            this.nodeParent.toggleClosed(this.nodeParent);
          }

          var inheritors = this.get('inheritors').inheritors;
          this.trigger('modified', this);
        }
      }
      this.updateInheritorParams(data);

    },

    updateInheritorParams: function(data) {

      var inheritors = this.get('inheritors').inheritors;
      for (var i = 0; i < inheritors.length; i++) {
        var toggleClosed = false;
        if (inheritors[i].nodeParent && inheritors[i].nodeParent.get('name') === 'group' && !inheritors[i].nodeParent.get('open')) {
          inheritors[i].nodeParent.toggleOpen(inheritors[i].nodeParent);
          toggleClosed = true;
        }

        var path = this.get('normal_geom').clone();
        var userParams = inheritors[i].get('userParams');
        userParams[0].val = data.value;
        inheritors[i].set('userParams', userParams);

        var radius = inheritors[i].get('width') / 2;
        path.position = new paper.Point(0, 0);
        path.fillColor = inheritors[i].get('geom').fillColor;
        path.strokeColor = inheritors[i].get('geom').strokeColor;
        inheritors[i].generatePoints(path, true);
        inheritors[i].changeGeomInheritance(path);

        path.visible = false;
        inheritors[i].transformSelf();

        if (toggleClosed) {
          inheritors[i].nodeParent.toggleClosed(inheritors[i].nodeParent);
        }
        inheritors[i].trigger('modified', inheritors[i]);
      }
    }

  });

  return PolygonNode;
});