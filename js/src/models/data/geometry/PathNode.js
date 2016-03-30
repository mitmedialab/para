/*PathNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/geometry/GeometryNode',
  'models/data/geometry/PointNode',
  'utils/TrigFunc',
  'models/data/properties/PPoint',
  'paper',
  'models/data/properties/PFloat',
  'models/data/properties/PColor'


], function(_, GeometryNode, PointNode, TrigFunc, PPoint, paper, PFloat, PColor) {
  //drawable paper.js path object that is stored in the pathnode
  var PathNode = GeometryNode.extend({

    defaults: _.extend({}, GeometryNode.prototype.defaults, {

      name: 'path',
      type: 'geometry',
      points: null,
    }),


    initialize: function() {
      GeometryNode.prototype.initialize.apply(this, arguments);
      this.set('points', []);
    },

    

    create: function() {
      var instance = GeometryNode.prototype.create.apply(this, arguments);
      // instance.generatePoints(instance.get('geom'));
      return instance;
    },


    deleteSelf: function() {
     
      GeometryNode.prototype.deleteSelf.apply(this, arguments);
    },


    /*returns a clone of the paper js shape*/
    getShapeClone: function(relative) {
      var toggleClosed = false;
      if (this.nodeParent && this.nodeParent.get('name') === 'group' && !this.nodeParent.get('open')) {
        this.nodeParent.toggleOpen(this.nodeParent);
        toggleClosed = true;
      }
      var clone = this.get('geom').clone();
      if (toggleClosed) {
        this.nodeParent.toggleClosed(this.nodeParent);
      }

      return clone;
    },

    toJSON: function(noUndoCache) {
      var data = GeometryNode.prototype.toJSON.call(this,noUndoCache);
      this.get('geom').data.instance = null;
      data.geom = this.get('geom').exportJSON(false);
      this.get('geom').data.instance = this;

      return data;
    },


    parseJSON: function(data, manager) {

      //if (!this.get('geom')) {
      var geom = new paper.Path();
      geom.importJSON(data.geom);

      this.changeGeomInheritance(geom);
      return GeometryNode.prototype.parseJSON.call(this, data, manager);
    },


    changeGeomInheritance: function(path) {
      GeometryNode.prototype.changeGeomInheritance.call(this, path);
      this.generatePoints(path, true);

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
      this.get('strokeColor').setNull(false);
      this.get('fillColor').setNull(false);
      return data;
    },



    generatePoints: function(path, clear) {
      var points = this.get('points');
      if (clear) {
        points.length = 0;
      }
      if (path.segments) {
        var segments = path.segments;
        for (var j = 0; j < segments.length; j++) {
          var pointNode = new PointNode({}, {geometryGenerator: this.geometryGenerator});
          pointNode.normalizeGeometry(segments[j]);
          //this.addChildNode(pointNode);
          points.push(pointNode);
        }
      }
    },


    select: function(segments) {
      GeometryNode.prototype.select.apply(this, arguments);
      if (segments) {
        this.setSelectedSegments(segments);
      }
    },

    deselect: function() {
      GeometryNode.prototype.deselect.apply(this, arguments);
      this.deselectSegments();
    },

    //sets selection for segments
    setSelectedSegments: function(segments) {
      var proto_node = this.get('proto_node');
      if (proto_node) {
        return proto_node.setSelectedSegments(segments);
      } else {
        var points = this.get('points');
        var selectedPoints = [];
        for (var i = 0; i < segments.length; i++) {
          var index = segments[i].index;
          var point = points[index];
          point.set('selection_type', segments[i].type);
          point.get('selected').setValue(true);
          selectedPoints.push(point);
        }
        return selectedPoints;
      }
    },

    deselectSegments: function() {
      var proto_node = this.get('proto_node');
      if (proto_node) {
        proto_node.deselectSegments();
      } else {
        var points = this.get('points');
        for (var i = 0; i < points.length; i++) {
          points[i].get('selected').setValue(false);
        }
      }
    },

    inheritSelectedPoints: function() {
      var proto_node = this.get('proto_node');
      if (proto_node) {
        return proto_node.inheritSelectedPoints();
      } else {
        var points = this.get('points');
        var selected_points = points.filter(function(point) {
          return point.get('selected').getValue();
        });
        return selected_points;
      }
    },

    /* modifyPoints
     * called when segment in geometry is modified
     */
    modifyPoints: function(data, mode, modifier, exclude, registerUndo) {
      
    if (registerUndo) {
        this.addToUndoStack();
    }
      var proto_node = this.get('proto_node');


      var geom = this.get('geom');
      var startWidth = geom.bounds.width;
      var startHeight = geom.bounds.height;

      var selectedPoints = this.inheritSelectedPoints();
      var indicies = [];

      for (var i = 0; i < selectedPoints.length; i++) {

        var selectedPoint = selectedPoints[i];
        var geomS = geom.segments[selectedPoint.get('index')];
        indicies.push({
          index: selectedPoint.get('index'),
          type: selectedPoint.get('selection_type')
        });
        switch (selectedPoint.get('selection_type')) {
          case 'segment':
          case 'curve':
            var p = selectedPoint.get('position');
            p.add(data.translationDelta);
            geomS.point.x += data.translationDelta.x;
            geomS.point.y += data.translationDelta.y;

            break;
          case 'handle-in':
            var hi = selectedPoint.get('handle_in');
            hi.add(data.translationDelta);
            geomS.handleIn.x += data.translationDelta.x;
            geomS.handleIn.y += data.translationDelta.y;
            break;

          case 'handle-out':
            var ho = selectedPoint.get('handle_out');
            ho.add(data.translationDelta);
            geomS.handleOut.x += data.translationDelta.x;
            geomS.handleOut.y += data.translationDelta.y;
            break;
        }
        this.trigger('modified', this);
      }


      var endWidth = geom.bounds.width;
      var endHeight = geom.bounds.height;
      var wDiff = (endWidth - startWidth) / 2;
      var hDiff = (endHeight - startHeight) / 2;

      var inheritors = this.get('inheritors').inheritors;
      var delta;
      var toggleClosed = false;
      if (this.nodeParent && this.nodeParent.get('name') === 'group' && !this.nodeParent.get('open')) {
        this.nodeParent.toggleOpen(this.nodeParent);
        toggleClosed = true;
      }
      delta = this.inverseTransformPoint(new paper.Point(data.translationDelta.x, data.translationDelta.y));
      if (toggleClosed) {
        this.nodeParent.toggleClosed(this.nodeParent);
      }

      for (var j = 0; j < inheritors.length; j++) {
        inheritors[j].modifyPointsByIndex({x:delta.x, y:delta.y}, indicies, exclude);
      }
      if (proto_node) {
        proto_node.modifyPointsByIndex({x:delta.x, y:delta.y}, indicies, this);
      }

    },

    /* modifyPointsByIndex
     * called by prototpye to update inheritor points
     * note: does not actually correspond to prototypal inheritance
     * model since that would require repeatedly cloning paperjs objects
     * which would be too memory intensive. Instead just applies transformations
     * on the prototype's geometry to those of the inheritor
     */
    modifyPointsByIndex: function(initial_delta, indicies, exclude) {

      var geom = this.get('geom');

      var delta;
      var toggleClosed = false;
      if (this.nodeParent && this.nodeParent.get('name') === 'group' && !this.nodeParent.get('open')) {
        this.nodeParent.toggleOpen(this.nodeParent);
        toggleClosed = true;
      }
      delta = this.transformPoint({x:initial_delta.x,y:initial_delta.y});

      for (var i = 0; i < indicies.length; i++) {
        var geomS = geom.segments[indicies[i].index];


        switch (indicies[i].type) {
          case 'segment':
          case 'curve':
            geomS.point.x += delta.x;
            geomS.point.y += delta.y;
          
            break;
          case 'handle-in':
            geomS.handleIn.x += delta.x;
            geomS.handleIn.y += delta.y;
         
            break;

          case 'handle-out':
            geomS.handleOut.x += delta.x;
            geomS.handleOut.y += delta.y;
            
            break;
        }

      }

      if (toggleClosed) {
        this.nodeParent.toggleClosed(this.nodeParent);
      }

      var inheritors = this.get('inheritors').inheritors;
      for (var j = 0; j < inheritors.length; j++) {
        if (!exclude || inheritors[j] != exclude) {
          inheritors[j].modifyPointsByIndex(initial_delta, indicies);
        }
      }

      geom.visible = true;
      this.trigger('modified', this);

    },


    renderSelection: function(geom) {
      GeometryNode.prototype.renderSelection.call(this, geom);
      var proto = this.get('proto_node');
      var pointSelected = false;
      var points = proto ? proto.get('points') : this.get('points');
      for (var i = 0; i < points.length; i++) {
        var selectedPoint = points[i];
        var geomS = geom.segments[selectedPoint.get('index')];
        if (selectedPoint.get('selected').getValue()) {
          geomS.selected = true;
          pointSelected = true;
        }
      }
      if (pointSelected) {
        this.get('geom').selected = true;
        this.get('bbox').selected = false;

      }



    }


  });

  return PathNode;

});