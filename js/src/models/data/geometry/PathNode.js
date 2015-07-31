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
  'utils/PPoint',
  'paper',
  'utils/PFloat',
  'utils/PColor'


], function(_, GeometryNode, PointNode, TrigFunc, PPoint, paper, PFloat, PColor) {
  //drawable paper.js path object that is stored in the pathnode
  var PathNode = GeometryNode.extend({

    defaults: _.extend({}, GeometryNode.prototype.defaults, {

      name: 'path',
      type: 'geometry',
      points: null,
    }),


    initialize: function(data) {
      GeometryNode.prototype.initialize.apply(this, arguments);
      this.set('points', []);
    },

    removePrototype: function() {
      GeometryNode.prototype.removePrototype.apply(this, arguments);
      this.setPathAltered();
      var geom = this.get('geom');
      var bbox = this.get('bbox');
      var selection_clone = this.get('selection_clone');

      geom.transform(this._ti_matrix);
      geom.transform(this._si_matrix);
      geom.transform(this._ri_matrix);
      selection_clone.transform(this._ti_matrix);
      selection_clone.transform(this._si_matrix);
      selection_clone.transform(this._ri_matrix);
      bbox.transform(this._ti_matrix);
      bbox.transform(this._si_matrix);
      bbox.transform(this._ri_matrix);
      geom.selected = false;
      bbox.selected = false;

      this.generatePoints(geom);

    },

    create: function() {
      var instance = GeometryNode.prototype.create.apply(this, arguments);
      // instance.generatePoints(instance.get('geom'));
      return instance;
    },

    /*normalizeGeometry
     * generates a set of transformation data based on the matrix
     * then inverts the matrix and normalizes the path based on these values
     * returns the transformation data
     */
    normalizeGeometry: function(path, matrix) {

      var data = {};
      // TODO: make some normalizations util function
      var rotation_delta;
      if (matrix.rotation < 0) {
        rotation_delta = 360 + matrix.rotation;
      } else {
        rotation_delta = matrix.rotation;
      }
      data.rotation_delta = {
        val: rotation_delta
      };

      data.scaling_delta = {
        x: matrix.scaling.x,
        y: matrix.scaling.y,
        operator: 'add'
      };

      var translation_delta = {
        x: matrix.translation.x,
        y: matrix.translation.y,
        operator: 'add'
      };
      var position = {
        x: 0,
        y: 0,
        operator: 'set'
      };

      data.translation_delta = translation_delta;
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
        data.fill_color = path.fillColor.toCSS(true);
      }
      else{
        data.fill_color = -1;
      }
      if (path.strokeColor) {
        data.stroke_color = path.strokeColor.toCSS(true);
      }
      else{
        data.stroke_color=-1;
      }
      data.stroke_width = {
        val: path.strokeWidth
      };

      var imatrix = matrix.inverted();
      path.transform(imatrix);

      this.set('width', path.bounds.width);
      this.set('height', path.bounds.height);

      this.generatePoints(path);

      path.visible = false;
      path.selected = false;
      path.data.nodetype = this.get('name');
      path.data.instance = this;
      path.data.geom = true;
      this.set('geom', path);


      this.setValue(data);

      var path_altered = this.get('path_altered');
      path_altered.setNull(false);
      this.setPathAltered();
      return data;
    },

    generatePoints: function(path) {
      var points = this.get('points');
      if (path.segments) {
        var segments = path.segments;
        for (var j = 0; j < segments.length; j++) {
          var pointNode = new PointNode();
          pointNode.normalizeGeometry(segments[j]);
          this.addChildNode(pointNode);
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
          point.set('selected', true);
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
          points[i].set('selected', false);
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
          return point.get('selected');
        });
        return selected_points;
      }
    },

    /* modifyPoints
     * called when segment in geometry is modified
     */
    modifyPoints: function(data, mode, modifier, exclude) {
      var proto_node = this.get('proto_node');
      var delta = new paper.Segment(new paper.Point(data.translation_delta.x, data.translation_delta.y), null, null);
      var origin = new paper.Point(0, 0);
      delta.transform(this._ri_matrix);
      delta.transform(this._si_matrix);

      var geom = this.get('geom');
      var selection_clone = this.get('selection_clone');
      var startWidth = geom.bounds.width;
      var startHeight = geom.bounds.height;

      var selectedPoints = this.inheritSelectedPoints();
      //maintains constraints on points
      var indicies = [];
      for (var i = 0; i < selectedPoints.length; i++) {

        var selectedPoint = selectedPoints[i];
        var geomS = geom.segments[selectedPoint.get('index')];
        var selectionS = selection_clone.segments[selectedPoint.get('index')];
        indicies.push({
          index: selectedPoint.get('index'),
          type: selectedPoint.get('selection_type')
        });
        switch (selectedPoint.get('selection_type')) {
          case 'segment':
          case 'curve':
            var p = selectedPoint.get('position');
            p.add(data.translation_delta);
            geomS.point.x += data.translation_delta.x;
            geomS.point.y += data.translation_delta.y;
            selectionS.point.x += data.translation_delta.x;
            selectionS.point.y += data.translation_delta.y;

            break;
          case 'handle-in':
            var hi = selectedPoint.get('handle_in');
            hi.add(data.translation_delta);
            geomS.handleIn.x += data.translation_delta.x;
            geomS.handleIn.y += data.translation_delta.y;
            selectionS.handleIn.x += data.translation_delta.x;
            selectionS.handleIn.y += data.translation_delta.y;
            break;

          case 'handle-out':
            var ho = selectedPoint.get('handle_out');
            ho.add(data.translation_delta);
            geomS.handleOut.x += data.translation_delta.x;
            geomS.handleOut.y += data.translation_delta.y;
            selectionS.handleOut.x += data.translation_delta.x;
            selectionS.handleOut.y += data.translation_delta.y;
            break;
        }

      }
      var endWidth = geom.bounds.width;
      var endHeight = geom.bounds.height;
      var wDiff = (endWidth - startWidth) / 2;
      var hDiff = (endHeight - startHeight) / 2;

      var inheritors = this.get('inheritors').accessProperty();
      for (var j = 0; j < inheritors.length; j++) {
        inheritors[j].modifyPointsByIndex(delta.point, indicies, exclude);
      }
      if (proto_node) {
        proto_node.modifyPointsByIndex(delta.point, indicies, this);
      }
      delta.remove();
      delta = null;
    },

    /* modifyPointsByIndex
     * called by prototpye to update inheritor points
     * note: does not actually correspond to prototypal inheritance
     * model since that would require repeatedly cloning paperjs objects
     * which would be too memory intensive. Instead just applies transformations
     * on the prototype's geometry to those of the inheritor
     */
    modifyPointsByIndex: function(point, indicies, exclude) {
      var geom = this.get('geom');
      var selection_clone = this.get('selection_clone');
      var bbox = this.get('bbox');
      if (!this.get('path_altered').getValue()) {
        geom.transform(this._ti_matrix);
        geom.transform(this._si_matrix);
        geom.transform(this._ri_matrix);
        selection_clone.transform(this._ti_matrix);
        selection_clone.transform(this._si_matrix);
        selection_clone.transform(this._ri_matrix);
        bbox.transform(this._ti_matrix);
        bbox.transform(this._si_matrix);
        bbox.transform(this._ri_matrix);
        this.setPathAltered();
      }

      for (var i = 0; i < indicies.length; i++) {
        var geomS = geom.segments[indicies[i].index];
        var selectionS = selection_clone.segments[indicies[i].index];
        switch (indicies[i].type) {
          case 'segment':
          case 'curve':
            geomS.point.x += point.x;
            geomS.point.y += point.y;
            selectionS.point.x += point.x;
            selectionS.point.y += point.y;

            break;
          case 'handle-in':
            geomS.handleIn.x += point.x;
            geomS.handleIn.y += point.y;
            selectionS.handleIn.x += point.x;
            selectionS.handleIn.y += point.y;

            break;

          case 'handle-out':
            geomS.handleOut.x += point.x;
            geomS.handleOut.y += point.y;
            selectionS.handleOut.x += point.x;
            selectionS.handleOut.y += point.y;
            break;
        }
      }
      var inheritors = this.get('inheritors').accessProperty();
      for (var j = 0; j < inheritors.length; j++) {
        if (!exclude || inheritors[j] != exclude) {
          inheritors[j].modifyPointsByIndex(point, indicies);
        }
      }
    },


    renderSelection: function(geom) {
      GeometryNode.prototype.renderSelection.call(this, geom);
      var proto = this.get('proto_node');
      var pointSelected = false;
      var points = proto ? proto.get('points') : this.get('points');
      for (var i = 0; i < points.length; i++) {
        var selectedPoint = points[i];
        var geomS = geom.segments[selectedPoint.get('index')];
        if (selectedPoint.get('selected')) {
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