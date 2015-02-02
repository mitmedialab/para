/* PaperUI.js
 * 
 * This is a namespace with utilities for drawing nice UI elements
 * as Paper objects. Note that these utilities don't deal with event-handling
 * on the UI elements, only with their drawing. In this way, these methods
 * are kept general enough to be used throughout the system, rather than
 * for any specific tool.
 */

define([
  'jquery',
  'underscore',
  'paper',
  'backbone',
  'utils/PPoint',
  'utils/Utils'
], function($, _, paper, backbone, PPoint, Utils) {
 
  
  var PaperUI = {
    dashArray: [10, 12],      // a default dash array for UI
    pathReferences: [],       // a list of references to UI objects
                              // useful for redrawing and clearing
                              // TODO: use named UI elements instead

    
    /*
     * Given a set of reference instances and a set of relative instances,
     * draw a directionality marker from the references to the relatives.
     * This particular marker has the references "bundled" by having lines
     * from the coincide at a single point; same for references. The 
     * coinciding points are then connected by an arrow.
     *
     * @param references - a list of reference instances
     * @param relatives  - a list of relative instances
     */
    drawConstraintArrow: function( references, relatives ) {
      var ref_positions = getPropFromList( references, 'position' );
      var rel_positions = getPropFromList( relatives, 'position' );
      var ref_centroid = getCentroid( ref_positions );
      var rel_centroid = getCentroid( rel_positions );
      var arrowPath = new paper.Path();
      var midVector = rel_centroid - ref_centroid;
      arrowPath.strokeColor = 'green';
      for (var i = 0; i < ref_positions.length; i++) {
        arrowPath.add(ref_positions[i], ref_centroid);
      }
      arrowPath.add(rel_centroid);
      arrowPath.add(rel_centroid + midVector.rotate(145));
      arrowPath.add(rel_centroid);
      arrowPath.add(rel_centroid + midVector.rotate(-145));
      arrowPath.add(rel_centroid);
      for (var i = 0; i < rel_positions.length; i++) {
        arrowPath.add(rel_positions[i], rel_centroid);
      }
    },

    /*
     * Draw dashed lines for maximum, minimum, and average x- and y-
     * positions for a set of instances, and give them names for reference
     *
     * Name format: delimit-(func)-position-(x|y)
     *
     * @param references - Not actually used...@TODO take out
     * @param relatives  - The instances to compute properties from
     * @param delimiters - An object containing desired delimiters
     */
    drawPositionDelimiters: function( references, relatives, delimiters ) {
      // delimiters to check for in the delimiter object
      var propArray = ['max-position-x', 'max-position-y', 'avg-position-x', 'avg-position-y', 'min-position-x', 'min-position-y'];

      // go through each position delimiter and draw a line if the
      // delimiter is in the delimiters object
      for (var i = 0; i < propArray.length; i++) {
        var property = propArray[i];
        if ( property in delimiters ) {
          // split the delimiter into pieces for function and property
          var property_split = property.split('-');
          var func = property_split[0];
          var axis = property_split[property_split.length - 1];

          // compute the value to draw for
          var value = Utils[func]( Utils.getPropFromList( relatives, property_split.slice(1, property_split.length) ) );
          var path;

          // create the line corresponding to the value and axis
          if ( axis == 'x' ) {
            path = new paper.Path({
              segments: [[value, paper.view.bounds.y], [value, paper.view.bounds.y + paper.view.bounds.height]]
            });
          }
          if ( axis == 'y' ) {
            path = new paper.Path({
              segments: [[paper.view.bounds.x, value], [paper.view.bounds.x + paper.view.bounds.width, value]]
            });
          }
          path.name = 'delimit-' + property;
          path.strokeColor = 'green';
          path.dashArray = this.dashArray;
          this.pathReferences.push(path);
        }
      }
      paper.view.draw();
    },

    drawScaleDelimiters: function( references, relatives, delimiters ) {
      // draw dashed boxes (made of pairs of lines) for each scale
    },

    drawOrientationDelimiters: function( references, relatives, delimiters ) {
      // draw dashed circle with arrows for each orientation
    },

    drawWeightDelimiters: function( references, relatives, delimiters ) {
      // draw shapes of delimiter-levels of thickness, different colors around references
    },

    drawStrokeDelimiters: function( references, relatives, delimiters ) {

    },

    drawFillDelimiters: function( references, relatives, delimiters ) {

    },

    /*
     * Remove all Paper UI elements from the canvas, as well as from
     * tracking.
     */
    clear: function() {
      for (var i = 0; i < this.pathReferences.length; i++) {
        this.pathReferences[i].remove();
      }
      this.pathReferences = [];
      paper.view.draw();
    },

    /*
     * Redraws the paths tracked. This is necessary because on each action
     * Para clears the Paper project, and recreates the paths based on 
     * stored information regarding geometry and style.
     *
     * NOTE: I recomomend that the entire paradigm of project clearing 
     * after every action be overhauled. It is difficult to do event 
     * handling with respect to UI elements with the current paradigm.
     */
    redraw: function() {
      // TODO: fix this bizarre hack by somehow copying the geometry and style of each referenced path into new path objects
      for (var i = 0; i < this.pathReferences.length; i++) {
        this.pathReferences[i] = new paper.Path( {'segments': this.pathReferences[i].segments, 'strokeColor': this.pathReferences[i].strokeColor, 'dashArray': this.pathReferences[i].dashArray, 'name': this.pathReferences[i].name} );
      }
    }
  };

  return PaperUI;
});
