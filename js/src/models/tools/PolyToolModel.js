/*PolyToolModel.js
 *tool for drawing regular polygons
 */

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
], function(_, Backbone, BaseToolModel) {

  var nameVal = 0;
  var sideNum = 6;
  var rotationAmt = 0;
  var scaleAmt = 0;
  var polyPath = null;

  var PolyToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      var paper = this.get('paper');
    },

    /*mousedown event- checks to see if current path has been initialized-
     *if it has not, create a new one and trigger a shapeAdded event
     */
    mouseDown: function(event) {
      var paper = this.get('paper');
      polyPath = new paper.Path.RegularPolygon(event.point, sideNum, 1);
      polyPath.selected = true;
      polyPath.strokeWidth = this.get('stroke_width');
      polyPath.strokeColor = this.get('stroke_color');
      polyPath.fillColor = this.get('fill_color');

      if (this.get('fill_color') === -1) {
        polyPath.style.fillColor = null;

      }
      if (this.get('stroke_color') === -1) {
        polyPath.style.strokeColor = null;

      }
      rotationAmt = 0;
    },



    //mouse up event
    mouseUp: function(event) {
      if (polyPath) {
        var matrix = this.get('matrix');
        matrix.reset();
        matrix.translate(polyPath.bounds.center.x, polyPath.bounds.center.y);
        matrix.rotate(rotationAmt);
        var paths = this.get('literals');
       paths.push(polyPath);
        this.set('literals', paths);
        this.trigger('geometryAdded');
      }
    },

    //mouse drag event
    mouseDrag: function(event) {

      if (polyPath) {
        var delta = polyPath.position.getDistance(event.point);
        var angle = event.point.subtract(polyPath.position).angle;
        var cAngle = polyPath.firstSegment.point.subtract(polyPath.position).angle;
        var rad = polyPath.position.getDistance(polyPath.firstSegment.point);
        var scale = delta / rad;
        var rotate = angle - cAngle;
        rotationAmt += rotate;
        polyPath.scale(scale);
        polyPath.rotate(rotate);

      }

    },



  });

  return PolyToolModel;

});