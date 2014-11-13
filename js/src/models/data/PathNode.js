/*PathNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/GeometryNode',
  'models/PaperManager',
  'utils/TrigFunc',
  'utils/PPoint'

], function(_, GeometryNode, PaperManager, TrigFunc, PPoint) {
  //drawable paper.js path object that is stored in the pathnode
  var paper = PaperManager.getPaperInstance();
  var PathNode = GeometryNode.extend({
    name: 'path',
    type: 'geometry',



    constructor: function() {

      GeometryNode.apply(this, arguments);
      this.masterPath = null;


    },


    initialize: function(data) {
      GeometryNode.prototype.initialize.apply(this, arguments);


    },

    undoRedo: function(data) {
      this.clearObjects();
      GeometryNode.prototype.undoRedo.apply(this, arguments);
      var path = new paper.Path();

    },



    exportJSON: function(data) {
      //console.log("path export json")
      var jdata;
      if (!data) {
        this.set({
          type: this.type,
          name: this.name
        });
        jdata = this.toJSON();
      } else {
        jdata = data;
      }

      return GeometryNode.prototype.exportJSON.apply(this, [jdata]);
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
      data.translation_delta = new PPoint(matrix.translation.x, matrix.translation.y);
      data.rotation_origin = data.translation_delta;
      data.scaling_origin = data.translation_delta;

      this.masterPath = path;
      var imatrix = matrix.inverted();
      path.transform(imatrix);
      path.visible = false;
      path.selected = false;
      return data;
    },

    /*run
     *creates a new path based on master path, stores it in the instances array
     * and returns it
     */
    run: function() {
//console.log('run called on ', this.name);
      var renderPath = this.masterPath.clone();
      this.instances.push(renderPath);
      renderPath.visible = true;
      return {
        path: renderPath,
      };



    },


    /*reset
     *removes all rendered instances, eventually change to reset
     * them and only delete those which are not used by the user
     */
    reset: function() {
      for (var i = 0; i < this.instances.length; i++) {
        this.instances[i].remove();
      }

    },

    clearObjects: function() {

    },



    cloneLiteral: function(literal) {

    },


    //called when path points are modified 
    updatePath: function(index, literalIndex, delta, handle) {

    },

    //checks to see if path exists in path_literals array
    containsPath: function(path) {

    },

    //selects or deselects all path instances
    selectAll: function() {

    },

    deselectAll: function() {


    },

    //checks for intersection and returns the first path found
    checkIntersection: function() {

      return null;
    }



  });

  return PathNode;

});