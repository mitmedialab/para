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
  var startPosition = null;
  var scaleAmt = 0;
  var polyPath = null;
  var drag = false;
  var literal = null;
  var lastDeltaX;
  var lastDeltaY;
  var PolyToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      mode: 'poly'
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);

    },

    /*mousedown event
     */
    mouseDown: function(event) {
      startPosition = event.point;
      switch (this.get('mode')) {
        case 'poly':
          polyPath = new paper.Path.RegularPolygon(event.point, sideNum, 1);
          break;
        default:
          var rectangle = new paper.Rectangle(event.point, new paper.Size(1, 1));
          switch (this.get('mode')) {
            case 'ellipse':
              polyPath = new paper.Path.Ellipse(rectangle);
              break;
            case 'rect':
              polyPath = new paper.Path.Rectangle(rectangle);
              break;
          }
          break;
      }
      polyPath.selected = true;
      polyPath.strokeWidth = this.get('style').stroke_width;
      polyPath.strokeColor = this.get('style').stroke_color;
      polyPath.fillColor = this.get('style').fill_color;

      if (this.get('style').fillColor === -1) {
        polyPath.style.fillColor = null;

      }
      if (this.get('style').stroke_color === -1) {
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

          literal = polyPath;

          this.trigger('geometryAdded', literal);

        } else {
          polyPath.remove();
        }
        polyPath = null;

      }
      drag = false;

    },

    //mouse drag event
    mouseDrag: function(event) {
      switch (this.get('mode')) {
        case 'poly':
          this.polyMouseDrag(event);
          break;
        default:
          this.regularMouseDrag(event);
          break;
      }
    },

    polyMouseDrag: function(event) {

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
    //mouse drag event
    regularMouseDrag: function(event) {
      if (polyPath) {
        drag = true;

        var deltaX = event.point.x - startPosition.x;
        var deltaY = event.point.y - startPosition.y;

        polyPath.remove();
        var rectangle = new paper.Rectangle( startPosition, new paper.Size(deltaX, deltaY));
        if(this.get('mode')==='rect'){    
          polyPath = new paper.Path.Rectangle(rectangle);
        }
        else{
          polyPath = new paper.Path.Ellipse(rectangle);
        }

         polyPath.selected = true;
      polyPath.strokeWidth = this.get('style').stroke_width;
      polyPath.strokeColor = this.get('style').stroke_color;
      polyPath.fillColor = this.get('style').fill_color;

      if (this.get('style').fillColor === -1) {
        polyPath.style.fillColor = null;

      }
      if (this.get('style').stroke_color === -1) {
        polyPath.style.strokeColor = null;

      }
        console.log("path data", polyPath.bounds,deltaX,deltaY);

      }

    },



  });

  return PolyToolModel;

});