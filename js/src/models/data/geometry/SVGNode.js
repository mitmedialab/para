/*SVGNode.js
 * imported svg object
 * extends PathNode
 */


define([
  'underscore',
  'models/data/geometry/PathNode',
  'models/data/geometry/GeometryNode',
  'utils/TrigFunc',
  'utils/PPoint',
  'paper',
  'utils/PFloat',
  'utils/PColor'


], function(_, PathNode, GeometryNode, TrigFunc, PPoint, paper, PFloat, PColor) {
  //drawable paper.js path object that is stored in the pathnode
  var SVGNode = PathNode.extend({

    defaults: _.extend({}, PathNode.prototype.defaults, {

      name: 'svg',
      type: 'geometry',

    }),


    initialize: function(data) {
      PathNode.prototype.initialize.apply(this, arguments);

    },


    /*normalizeGeometry
     * generates a set of transformation data based on the matrix
     * then inverts the matrix and normalizes the path based on these values
     * returns the transformation data
     */
    normalizeGeometry: function(path, matrix) {
      var data = {};
      // TODO: make some normalizations util function
      var rotationDelta;
      if (matrix.rotation < 0) {
        rotationDelta = 360 + matrix.rotation;
      } else {
        rotationDelta = matrix.rotation;
      }
      data.rotationDelta = {
        v: rotationDelta
      };

      data.scalingDelta = {
        x: matrix.scaling.x,
        y: matrix.scaling.y,
        operator: 'add'
      };

      var translationDelta = {
        x: matrix.translation.x,
        y: matrix.translation.y,
        operator: 'add'
      };
      var position = {
        x: 0,
        y: 0,
        operator: 'set'
      };

      data.translationDelta = translationDelta;
      data.position = position;

      data.rotation_origin = {
        x: 0,
        y: 0,
        operator: 'set'
      };
      data.scaling_origin = {
        x: 0,
        y: 0,
        operator: 'set'
      };
      if (path.fillColor) {
        data.fillColor = {
          r: path.fillColor.red,
          g: path.fillColor.green,
          b: path.fillColor.blue,
          h: path.fillColor.hue,
          s: path.fillColor.saturation,
          l: path.fillColor.lightness,
          operator: 'set'
        };
      } else {
        data.fillColor = {
          noColor: true
        };
      }
      if (path.strokeColor) {
        data.strokeColor = {
          r: path.strokeColor.red,
          g: path.strokeColor.green,
          b: path.strokeColor.blue,
          h: path.strokeColor.hue,
          s: path.strokeColor.saturation,
          l: path.strokeColor.lightness,
          operator: 'set'
        };
      } else {
        data.strokeColor = {
          noColor: true
        };
      }
      data.strokeWidth = {
        v: path.strokeWidth
      };

      var imatrix = matrix.inverted();
      path.transform(imatrix);
      this.set('width', path.bounds.width);
      this.set('height', path.bounds.height);

      path.visible = false;
      path.selected = false;
      this.changeGeomInheritance(path);

      this.setValue(data);

     var pathAltered = this.get('pathAltered');
     pathAltered.setNull(false);
     this.setPathAltered();
      return data;
    },

  renderSelection: function(geom) {
      GeometryNode.prototype.renderSelection.call(this, geom);

    },

    renderStyle: function(geom) {
      if (!this._fillColor.noColor && (this._fillColor.h > -1 && this._fillColor.s > -1 && this._fillColor.l > -1)) {
        if (!geom.fillColor) {
          geom.fillColor = new paper.Color(0, 0, 0);
        }
        if(this._fillColor.h){
        geom.fillColor.hue = this._fillColor.h;
        geom.fillColor.saturation = this._fillColor.s;
        geom.fillColor.lightness = this._fillColor.l;
        geom.fillColor.alpha = this._fillColor.a;
        }
      } else {
        geom.fillColor = undefined;
      }
      if (!this._strokeColor.noColor && (this._strokeColor.h > -1 && this._strokeColor.s > -1 && this._strokeColor.l > -1)) {
        if (!geom.fillColor) {
          geom.strokeColor = new paper.Color(0, 0, 0);
        }
        geom.strokeColor.hue = this._strokeColor.h;
        geom.strokeColor.saturation = this._strokeColor.s;
        geom.strokeColor.lightness = this._strokeColor.l;
        geom.strokeColor.alpha = this._strokeColor.a;
        geom.strokeColor.alpha = this._strokeColor.a;
      } else {
        geom.strokeColor = undefined;
      }

      geom.strokeWidth = this._strokeWidth;
      geom.visible = this._visible;
      var zIndex = this.get('zIndex').getValue();
      if (geom.index != zIndex) {
        geom.parent.insertChild(zIndex, geom);
      }
    },

  });
  return SVGNode;
});