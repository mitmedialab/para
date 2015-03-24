/*PathNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/Instance',
  'models/data/PointNode',
  'utils/TrigFunc',
  'utils/PPoint',
  'paper',
  'utils/PFloat',
  'utils/PColor'


], function(_, Instance, PointNode, TrigFunc, PPoint, paper, PFloat, PColor) {
  //drawable paper.js path object that is stored in the pathnode
  var PathNode = Instance.extend({

    defaults: _.extend({}, Instance.prototype.defaults, {

      name: 'path',
      type: 'geometry',
      points: null,
    }),


    initialize: function(data) {
      Instance.prototype.initialize.apply(this, arguments);
      this.set('points', []);
    },

    /*normalizeGeometry
     * generates a set of transformation data based on the matrix
     * then inverts the matrix and normalizes the path based on these values
     * returns the transformation data
     */
    normalizeGeometry: function(path, matrix) {

      var data = {};
      data.rotation_delta = new PFloat(matrix.rotation);
      // TODO: make some normalizations util function
      if (data.rotation_delta > 360 || data.rotation_delta < 0) {
        data.rotation_delta = TrigFunc.wrap(data.rotation_delta, 0, 360);
      }
      data.scaling_delta = new PPoint(matrix.scaling.x, matrix.scaling.y);

      var translation_delta = new PPoint(matrix.translation.x, matrix.translation.y, 'add');
      var position = new PPoint(0, 0, 'set');

      data.translation_delta = translation_delta;
      data.position = position;

      data.rotation_origin = new PPoint(0, 0, 'set');
      data.scaling_origin = new PPoint(0, 0, 'set');

      data.fill_color = new PColor(path.fillColor.red, path.fillColor.green, path.fillColor.blue, path.fillColor.alpha);
      data.stroke_color = new PColor(path.strokeColor.red, path.strokeColor.green, path.strokeColor.blue, path.strokeColor.alpha);

      data.stroke_width = new PFloat(path.strokeWidth);

      var imatrix = matrix.inverted();
      path.transform(imatrix);

      data.width = new PFloat(path.bounds.width);
      data.height = new PFloat(path.bounds.height);


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

      path.visible = false;
      path.selected = false;
      path.data.nodetype = this.get('name');
      path.data.instance = this;
      this.set('geom', path);


      for (var property in data) {
        if (data.hasOwnProperty(property)) {

          data[property].setNull(false);
        }
      }
      this.set(data);
      var path_altered = this.get('path_altered');
      path_altered.setNull(false);
      this.setPathAltered();

      return data;
    },

    setPathAltered: function() {
      var path_altered = this.get('path_altered');
      path_altered.setValue(true);
      this.set('path_altered', path_altered);
      var inheritors = this.get('inheritors');
      for (var i = 0; i < inheritors.length; i++) {
        inheritors[i].setPathAltered();
      }
    },


    //sets selection for segments
    setSelectedSegments: function(segments) {
      var points = this.get('points');
      for (var i = 0; i < segments.length; i++) {
        var index = segments[i].index;
        var point = points[index];
        point.set('selected', segments[i].type);
      }
    },

    deselectSegments: function() {
      var points = this.get('points');
      for (var i = 0; i < points.length; i++) {
        points[i].set('selected', false);
      }
    },

    /* modifyPoints
     * called when segment in geometry is modified
     */
    modifyPoints: function(data, mode, modifier) {
      var proto_node = this.get('proto_node');
      if (mode === 'proxy' && proto_node) {
        proto_node.modifyPoints(data, mode, modifier);
      }

      var points = this.get('points');
      var delta = new paper.Segment(new paper.Point(data.translation_delta.x, data.translation_delta.y), null, null);
      delta.transform(this.get('ri_matrix'));
      delta.transform(this.get('si_matrix'));
      var geom = this.get('geom');
      var selectedPoints = points.filter(function(point) {
        return point.get('selected');
      });
      //maintains constraints on points
      var indicies = [];
      for (var i = 0; i < selectedPoints.length; i++) {
        var selectedPoint = selectedPoints[i];

        var geomS = geom.segments[selectedPoint.get('index')];
        indicies.push({
          index: selectedPoint.get('index'),
          type: selectedPoint.get('selected')
        });
        switch (selectedPoint.get('selected')) {
          case 'segment':
          case 'curve':
            var p = selectedPoint.get('position');
            p.add(delta.point);
            geomS.point.x += data.translation_delta.x;
            geomS.point.y += data.translation_delta.y;

            break;
          case 'handle-in':
            var hi = selectedPoint.get('handle_in');
            hi.add(delta.point);
            geomS.handleIn.x += data.translation_delta.x;
            geomS.handleIn.y += data.translation_delta.y;
            break;

          case 'handle-out':
            var ho = selectedPoint.get('handle_out');
            ho.add(delta.point);
            geomS.handleOut.x += data.translation_delta.x;
            geomS.handleOut.y += data.translation_delta.y;
            break;
        }

      }
      var inheritors = this.get('inheritors');
      for (var j = 0; j < inheritors.length; j++) {
        inheritors[j].modifyPointsByIndex(delta.point, indicies);
      }
    },

     /* modifyPointsByIndex
     * called by prototpye to update inheritor points
     * note: does not actually correspond to prototypal inheritance
     * model since that would require repeatedly cloning paperjs objects
     * which would be too memory intensive. Instead just applies transformations
     * on the prototype's geometry to those of the inheritor
     */
    modifyPointsByIndex: function(point, indicies) {
      var geom = this.get('geom');
      geom.transform(this.get('ti_matrix'));
      geom.transform(this.get('ri_matrix'));
      geom.transform(this.get('si_matrix'));
      for (var i = 0; i < indicies.length; i++) {
        var geomS = geom.segments[indicies[i].index];
        switch (indicies[i].type) {
          case 'segment':
          case 'curve':
            geomS.point.x += point.x;
            geomS.point.y += point.y;

            break;
          case 'handle-in':
            geomS.handleIn.x += point.x;
            geomS.handleIn.y += point.y;
            break;

          case 'handle-out':
            geomS.handleOut.x += point.x;
            geomS.handleOut.y += point.y;
            break;
        }
      }
      this.setPathAltered();
      var inheritors = this.get('inheritors');
      for (var j = 0; j < inheritors.length; j++) {
        inheritors[j].modifyPointsByIndex(point, indicies);
      }
    },


    renderSelection: function(geom) {

      var points = this.get('points');
      for (var i = 0; i < points.length; i++) {
        var selectedPoint = points[i];
        var geomS = geom.segments[selectedPoint.get('index')];
        switch (selectedPoint.get('selected')) {
          case 'segment':
          case 'curve':
          case 'handle-in':
          case 'handle-out':
            geomS.selected = true;
            break;
        }
      }

      Instance.prototype.renderSelection.call(this, geom);

    }



  });

  return PathNode;

});