/* PaperUI.js
 * 
 * This is a static class with utilities for drawing nice UI elements
 * as Paper objects.
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
    dashArray: [10, 12],
    pathReferences: [],

    
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

    drawPositionDelimiters: function( references, relatives, delimiters ) {
      // draw dashed lines at each delimiter
      var propArray = ['max-position-x', 'max-position-y', 'avg-position-x', 'avg-position-y', 'min-position-x', 'min-position-y'];
      for (var i = 0; i < propArray.length; i++) {
        var property = propArray[i];
        if ( property in delimiters ) {
          var property_split = property.split('-');
          var func = property_split[0];
          var axis = property_split[property_split.length - 1];

          var value = Utils[func]( Utils.getPropFromList( relatives, property_split.slice(1, property_split.length) ) );
          console.log('Value gotten: ', value);
          var path;
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

    clear: function() {
      for (var i = 0; i < this.pathReferences.length; i++) {
        this.pathReferences[i].remove();
      }
      this.pathReferences = [];
      paper.view.draw();
    },

    redraw: function() {
      // TODO: fix this bizarre hack by somehow copying the geometry and style of each referenced path into new path objects
      // OR overhaul the entire paradigm of project clearing after every action ( probably better for long-term )
      for (var i = 0; i < this.pathReferences.length; i++) {
        this.pathReferences[i] = new paper.Path( {'segments': this.pathReferences[i].segments, 'strokeColor': this.pathReferences[i].strokeColor, 'dashArray': this.pathReferences[i].dashArray, 'name': this.pathReferences[i].name} );
      }
    }
  };

  return PaperUI;
});
