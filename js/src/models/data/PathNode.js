/*PathNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/Instance',
  'models/PaperManager',
  'utils/TrigFunc',
  'utils/PPoint'

], function(_, Instance, PaperManager, TrigFunc, PPoint) {
  //drawable paper.js path object that is stored in the pathnode
  var paper = PaperManager.getPaperInstance();
  var PathNode = Instance.extend({
    name: 'path',
    type: 'geometry',
    defaults: _.extend({}, Instance.prototype.defaults, {
      master_path: null,
      geom_instances: null,
    }),


    initialize: function(data) {
      this.set('geom_instances',[]);
      Instance.prototype.initialize.apply(this, arguments);

    },

    
    clone: function(){
      var clone = Instance.prototype.clone.apply(this,arguments);
      clone.set('master_path',this.get('master_path').clone());
      return clone;
    },


    /*normalizePath
     * generates a set of transformation data based on the matrix
     * then inverts the matrix and normalizes the path based on these values
     * returns the transformation data
     */
    normalizePath: function(path, matrix) {
      var data = {};
      data.rotation_delta = matrix.rotation;
      data.scaling_delta = new PPoint(matrix.scaling.x, matrix.scaling.y);
      //data.translation_delta = new PPoint(matrix.translation.x, matrix.translation.y);
      data.position = new PPoint(matrix.translation.x, matrix.translation.y);
      data.rotation_origin =  new PPoint(matrix.translation.x, matrix.translation.y);
      data.scaling_origin =  new PPoint(matrix.translation.x, matrix.translation.y);

      this.set('master_path', path);
      var imatrix = matrix.inverted();
      path.transform(imatrix);
      path.visible = false;
      path.selected = false;
      return data;
    },

    updateGeom:function(segment_index,data, rmatrix, smatrix, tmatrix){
        var master_path = this.get('master_path');
        if (data.translation_delta) {
            master_path.transform(rmatrix);
            master_path.transform(smatrix);
            master_path.transform(tmatrix);

           console.log("path trigger segment",segment_index);
          var delta = data.translation_delta.toPaperPoint();
          master_path.segments[segment_index].point=  master_path.segments[segment_index].point.add(delta);
          var rinverted = rmatrix.inverted();
          var sinverted = smatrix.inverted();
          var tinverted = tmatrix.inverted();

          master_path.transform(tinverted);
          master_path.transform(sinverted);
          master_path.transform(rinverted);
        }
        this.set('master_path',master_path);
    },

    /*run
     *creates a new path based on master path, stores it in the instances array
     * and returns it
     */
     inheritGeom: function() {
      console.log('path inherit geom called');
      var masterPath = this.get('master_path');
      var renderPath = masterPath.clone();
      var instances = this.get('geom_instances');
      instances.push(renderPath);
      this.set('geom_instances',instances);
      renderPath.visible = true;
      return renderPath;

    },


    /*reset
     *removes all rendered instances, eventually change to reset
     * them and only delete those which are not used by the user
     */
    reset: function() {
      var instances = this.get('geom_instances');
      for (var i = 0; i < instances.length; i++) {
        instances[i].remove();
      }
      this.set('geom_instances',[]);
      Instance.prototype.reset.apply(this,arguments);

    },



  });

  return PathNode;

});