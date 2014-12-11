/*PolyToolModel.js
 *tool for drawing regular polygons
 */

define([
  'underscore',
  'paper',
  'backbone',
  'models/tools/BaseToolModel',
], function(_, paper, Backbone, BaseToolModel) {

  var nameVal = 0;
  var sideNum = 6;
  var rotationAmt = 0;
  var scaleAmt = 0;
  var polyPath = null;
  var drag = false;

  var PolyToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {}),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);

    },

    /*mousedown event- checks to see if current path has been initialized-
     *if it has not, create a new one and trigger a shapeAdded event
     */
    mouseDown: function(event) {
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
        if (drag) {
          var matrix = this.get('matrix');
          matrix.reset();
          matrix.translate(polyPath.bounds.center.x, polyPath.bounds.center.y);
          matrix.rotate(rotationAmt);
          var paths = this.get('literals');
          paths.push(polyPath);
          this.set('literals', paths);
          this.trigger('geometryAdded');

        }
        else{
          polyPath.remove();
        }
        polyPath = null;

      }
      drag = false;

    },

    //mouse drag event
    mouseDrag: function(event) {

      if (polyPath) {
        drag = true;
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