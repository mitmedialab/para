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
    }),


    initialize: function(data) {
      Instance.prototype.initialize.apply(this, arguments);
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
      var position = new PPoint(0,0 ,'set');

      data.translation_delta=translation_delta;
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

      path.visible = false;
      path.selected = false;
      path.data.nodetype = this.get('name');
      if ( path.segments ) {
        var segments = path.segments;
        for(var j=0;j<segments.length;j++){
          var pointNode = new PointNode();
          pointNode.normalizeGeometry(segments[j]);
          this.addChildNode(pointNode);
        }
      }
      var pathJSON = path.exportJSON({
        asString: true
      });
      this.set('master_path', new PFloat(pathJSON));
     
      path.remove(); // WARNING: Memory leak??
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

    setPathAltered: function(){
      var path_altered = this.get('path_altered');
      path_altered.setValue(true);
      this.set('path_altered',path_altered);
      var inheritors = this.get('inheritors');
      for(var i=0;i<inheritors.length;i++){
         inheritors[i].setPathAltered();
      }
    },

    /* modifyPoints
     * called when segment in geometry is modified
     */
    modifyPoints: function(segment_index, data, handle, mode, modifier) {
      var proto_node = this.get('proto_node');
      if (mode === 'proxy' && proto_node) {
        proto_node.modifyPoints(segment_index, data, handle, 'none');
      }

      var master_pathJSON = this.accessProperty('master_path');
      var master_path = new paper.Path();
      master_path.importJSON(master_pathJSON);
      if (data.translation_delta) {
        var tmatrix = this.get('tmatrix');
        var rmatrix = this.get('rmatrix');
        var smatrix = this.get('smatrix');
        master_path.transform(rmatrix);
        master_path.transform(smatrix);
        master_path.transform(tmatrix);
        var delta = new paper.Point(data.translation_delta.x, data.translation_delta.y);
        if (!handle) {
          master_path.segments[segment_index].point = master_path.segments[segment_index].point.add(delta);
        } else {
          if (handle === 'handle-in') {
            master_path.segments[segment_index].handleIn = master_path.segments[segment_index].handleIn.add(delta);
            master_path.segments[segment_index].handleOut = master_path.segments[segment_index].handleOut.subtract(delta);

          } else {
            master_path.segments[segment_index].handleOut = master_path.segments[segment_index].handleOut.add(delta);
            master_path.segments[segment_index].handleIn = master_path.segments[segment_index].handleIn.subtract(delta);

          }
        }
        var rinverted = rmatrix.inverted();
        var sinverted = smatrix.inverted();
        var tinverted = tmatrix.inverted();

        master_path.transform(tinverted);
        master_path.transform(sinverted);
        master_path.transform(rinverted);
      
      }

      this.set('master_path', new PFloat(master_path.exportJSON({
        asString: true
      })));
      master_path.remove();
      var path_altered = this.get('path_altered');
    
      path_altered.setNull(false);
       this.setPathAltered();
    },

  });

  return PathNode;

});
