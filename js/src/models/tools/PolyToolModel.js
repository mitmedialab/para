/*PolyToolModel.js
 *tool for drawing regular polygons
 */

define([
  'underscore',
  'paper',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PolygonNode',
  'models/data/PathNode',
  'models/data/RectNode',
  'models/data/EllipseNode'
], function(_, paper, Backbone, BaseToolModel, PolygonNode,PathNode,RectNode,EllipseNode) {

  var sideNum = 6;
  var rotationAmt = 0;
  var startPosition = null;
  var polyPath = null;
  var drag = false;
  var segment, mode, type = null;
  var types = ['point', 'handleIn', 'handleOut'];


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
        case 'pen':
          this.penMouseDown(event);
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
      if (polyPath) {
        if (this.get('mode') !== 'pen') {
          polyPath.selected = true;
        }
        polyPath.strokeWidth = this.get('style').stroke_width;
        polyPath.strokeColor = this.get('style').stroke_color;
        polyPath.fillColor = this.get('style').fill_color;

        if (this.get('style').fillColor === -1) {
          polyPath.style.fillColor = null;

        }
        if (this.get('style').stroke_color === -1) {
          polyPath.style.strokeColor = null;

        }
      }
      rotationAmt = 0;
    },

    penMouseDown: function(event) {
      if (segment) {
        segment.selected = false;
      }
      mode = type = segment = null;

      if (!polyPath) {
        polyPath = new paper.Path();
      }

      var result = this.findHandle(event.point);
      if (result) {
        segment = result.segment;
        type = result.type;
        if (polyPath.segments.length > 1 && result.type === 'point' && result.segment.index === 0) {
          mode = 'close';
          polyPath.closed = true;
          this.reset();
        }
      }

      if (mode != 'close') {
        mode = segment ? 'move' : 'add';
        if (!segment) {
          segment = polyPath.add(event.point);
        }
        segment.selected = true;
      }

    },



    reset: function() {
      segment = null;
      if (polyPath) {
        if (polyPath.segments.length > 1) {
          var matrix = this.get('matrix');
          matrix.reset();
          matrix.translate(polyPath.bounds.center.x, polyPath.bounds.center.y);
          matrix.rotate(rotationAmt);
          this.createShape(polyPath);

        } else {
          polyPath.remove();
        }

      }

      polyPath = null;


    },

    //mouse up event
    mouseUp: function(event) {
      if (polyPath && (this.get('mode') !== 'pen')) {
        if (drag) {
          var matrix = this.get('matrix');
          matrix.reset();
          matrix.translate(polyPath.bounds.center.x, polyPath.bounds.center.y);
          matrix.rotate(rotationAmt);


          this.createShape(polyPath);

        } else {
          polyPath.remove();
        }
        polyPath = null;

      }
      drag = false;

    },

    createShape: function(path){

      var matrix = this.get('matrix');

      var pathNode;
      switch (this.get('mode')) {
        case 'poly':
          pathNode = new PolygonNode();
          break;
        case 'ellipse':
          pathNode = new EllipseNode();
          break;
        case 'rect':
          pathNode = new RectNode();
          break;
        case 'pen':
          pathNode = new PathNode();
          break;

      }
      pathNode.normalizeGeometry(path, matrix);
      this.trigger('geometryAdded',pathNode);
    },

    //mouse drag event
    mouseDrag: function(event) {
      switch (this.get('mode')) {
        case 'poly':
          this.polyMouseDrag(event);
          break;
        case 'pen':
          this.penMouseDrag(event);
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

    //mouse drag event - brokem
    penMouseDrag: function(event) {

      if (mode == 'move' && type == 'point') {
        segment.point = event.point;
      } else if (mode != 'close') {
        var delta = event.delta.clone();
        if (type == 'handleOut' || mode == 'add') {
          delta = delta.negate();
        }
        segment.handleIn = segment.handleIn.add(delta);
        segment.handleOut = segment.handleOut.subtract(delta);
      }


    },
    //mouse drag event
    regularMouseDrag: function(event) {
      if (polyPath) {
        drag = true;

        var deltaX = event.point.x - startPosition.x;
        var deltaY = event.point.y - startPosition.y;

        polyPath.remove();
        var rectangle = new paper.Rectangle(startPosition, new paper.Size(deltaX, deltaY));
        if (this.get('mode') === 'rect') {
          polyPath = new paper.Path.Rectangle(rectangle);
        } else {
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

      }

    },


    //method to determine location of handle for current segment for pen tool
    findHandle: function(point) {
      for (var i = 0, l = polyPath.segments.length; i < l; i++) {
        for (var j = 0; j < 3; j++) {
          var _type = types[j];
          var sub_segment = polyPath.segments[i];
          var segmentPoint;
          if (type == 'point') {
            segmentPoint = sub_segment.point;
          } else {
            segmentPoint = sub_segment.point.add(sub_segment[type]);

          }

          var distance = (point.subtract(segmentPoint)).length;
          if (distance < 3) {
            return {
              type: _type,
              segment: sub_segment
            };
          }
        }
      }
      return null;
    },



  });

  return PolyToolModel;

});
