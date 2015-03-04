/* PaperUIHelper.js
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
  'utils/Utils',
  'utils/PColor',
  'models/data/PaperUI',
], function($, _, paper, Utils, PColor, PaperUI) {
 
  
  var PaperUIHelper = {
    dashArray: [10, 12],      // a default dash array for UI

    sm: null,
    pathReferences: [],       // a list of references to UI objects
                              // useful for redrawing and clearing
                              // TODO: use named UI elements instead


    setup: function( sm ) {
      this.sm = sm;
      this.uilayer = new paper.Layer({});
      paper.project.activeLayer = paper.project.layers[0];
    },


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
      var ref_positions = getPropFromList( references, 'translation_delta' );
      var rel_positions = getPropFromList( relatives, 'translation_delta' );
      var ref_centroid = getCentroid( ref_positions );
      var rel_centroid = getCentroid( rel_positions );
      var arrowPath = new paper.Path();
      var midVector = rel_centroid - ref_centroid;
      arrowPath.strokeColor = '#A5FF00';
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

      var newPaths = [];
      // go through each delimiter and draw a line if the
      // delimiter is in the delimiters object
      for ( property in delimiters ) {
        // split the delimiter into pieces for function and property
        var property_split = property.split('-');
        var func = property_split[0];
        var axis = property_split[property_split.length - 1];

        // compute the value to draw for
        var value = Utils[func]( Utils.getPropFromList( relatives, property_split.slice(1, property_split.length) ) );

       
        // create the line corresponding to the value and axis
        if ( axis == 'x' ) {
          path = new paper.Path({
            segments: [[value, paper.view.bounds.y - 10 * paper.view.bounds.height], [value, paper.view.bounds.y + 10 * paper.view.bounds.height]]
          });
        }

        if ( axis == 'y' ) {
          path = new paper.Path({
            segments: [[paper.view.bounds.x - 10 * paper.view.bounds.width, value], [paper.view.bounds.x + 10 * paper.view.bounds.width, value]]
          });
        }
        
        path.name = 'delimit-' + property;
        path.strokeColor = '#A5FF00';
        path.strokeWidth = 3;
        path.fillColor = '#A5FF00'; // weirdly required for instance
        path.dashArray = this.dashArray;

        var uiNode = new PaperUI();
        var matrix = new paper.Matrix();
        matrix.translate(path.bounds.center.x, path.bounds.center.y);
        uiNode.normalizeGeometry( path, matrix ); 
        this.sm.addInstance( uiNode );
        this.pathReferences.push( uiNode );
        newPaths.push( uiNode );
      }
      return newPaths;
    },

    /*
     * Draw dashed boxes made of pairs of lines for maximum, minimum, and 
     * average x- and y- scales for a set of instances, and give them 
     * names for reference
     *
     * Name format: delimit-(func)-scale-(x|y)
     *
     * @param references - Not actually used...@TODO take out
     * @param relatives  - The instances to compute properties from
     * @param delimiters - An object containing desired delimiters
     */
    drawScaleDelimiters: function( references, relatives, delimiters ) {
    
      var ref = references[0].get('geom');
      var rel = relatives[0].get('geom'); 
      var newPaths = [];
      // go through each delimiter and draw a line if the
      // delimiter is in the delimiters object
      for ( property in delimiters ) {
        // split the delimiter into pieces for function and property
        var property_split = property.split('-');
        var func = property_split[0];
        var axis = property_split[property_split.length - 1];

        // create the line corresponding to the value and axis
        if ( axis == 'x' ) {
          path = new paper.Path({
            segments: [[rel.bounds.x - .2 * rel.bounds.width, rel.bounds.y - .1 * rel.bounds.height], [rel.bounds.x + 1.2 * rel.bounds.width, rel.bounds.y - .1 * rel.bounds.height]]
          });
        }

        if ( axis == 'y' ) {
          path = new paper.Path({
            segments: [[rel.bounds.x + 1.1 * rel.bounds.width, rel.bounds.y - .2 * rel.bounds.height], [rel.bounds.x + 1.1 * rel.bounds.width, rel.bounds.y + 1.2 * rel.bounds.height]]
          });
        }
       
        path.name = 'delimit-' + property;
        path.strokeColor = '#A5FF00';
        path.strokeWidth = 3;
        path.fillColor = '#A5FF00'; // weirdly required for instance
        path.dashArray = this.dashArray;

        var uiNode = new PaperUI();
        var matrix = new paper.Matrix();
        matrix.translate(path.bounds.center.x, path.bounds.center.y);
        uiNode.normalizeGeometry( path, matrix ); 
        this.sm.addInstance( uiNode );
        this.pathReferences.push( uiNode );
        newPaths.push( uiNode );
      }
      return newPaths;
    },

    /*
     * Draw dashed circles with pairs of orientation-indicating arrows
     * for maximum, minimum, and average orientations for a set of 
     * instances, and give them names for reference
     *
     * Name format: delimit-(func)-orientation-(x|y)
     *
     * @param references - Not actually used...@TODO take out
     * @param relatives  - The instances to compute properties from
     * @param delimiters - An object containing desired delimiters
     */
    drawOrientationDelimiters: function( references, relatives, delimiters ) {
      // draw dashed circle with arrows for each orientation
      
      var ref = references[0].get('geom');
      var rel = relatives[0].get('geom'); 
      var newPaths = [];
      
      var center = new paper.Point( rel.bounds.x + rel.bounds.width / 2, rel.bounds.y + rel.bounds.height / 2 );
      var radius = 1.1 * Utils.max(rel.bounds.width / 2, rel.bounds.height / 2);
      var bound_circle = new paper.Path.Circle({
        center: center,
        radius: radius 
      }); 
      bound_circle.name = 'bound_circle';
      bound_circle.strokeColor = '#A5FF00';
      bound_circle.strokeWidth = 3;
      bound_circle.fillColor = '#A5FF00'; // weirdly required for instance
      bound_circle.fillColor.alpha = 0.0;
      bound_circle.dashArray = this.dashArray;
      var uiNode = new PaperUI();
      var matrix = new paper.Matrix();
      matrix.translate(bound_circle.bounds.center.x, bound_circle.bounds.center.y);
      uiNode.normalizeGeometry( bound_circle, matrix ); 
      this.sm.addInstance( uiNode );
      this.pathReferences.push( uiNode );
      newPaths.push( uiNode );
      
      // go through each delimiter and draw a line if the
      // delimiter is in the delimiters object
      for ( property in delimiters ) {
        // split the delimiter into pieces for function and property
        var property_split = property.split('-');
        var func = property_split[0];
        var axis = property_split[property_split.length - 1];

        // compute the value to draw for
        var orientation = Utils[func]( Utils.getPropFromList( relatives, property_split.slice(1, property_split.length) ) );

        // create the line corresponding to the value and axis

        var point1 = new paper.Point( center.x , center.y - radius );
        var point2 = new paper.Point( center.x , center.y + radius );
       
        var arrow1 = new paper.Path({
          segments: [[point1.x - 7, point1.y - 14], [point1.x, point1.y], [point1.x - 7, point1.y + 14]]
        });
        var arrow2 = new paper.Path({
          segments: [[point2.x - 7, point2.y - 14], [point2.x, point2.y], [point2.x - 7, point2.y + 14]]
        });
        arrow1.rotate( orientation, center );
        arrow2.rotate( orientation, center );

        var path = arrow1; 
        // TODO: figure out how to make compound path with second arrow

        path.name = 'delimit-' + property;
        path.strokeColor = '#A5FF00';
        path.strokeWidth = 3;
        path.fillColor = '#A5FF00'; // weirdly required for instance
        path.fillColor.alpha = 0.0;

        var uiNode = new PaperUI();
        var matrix = new paper.Matrix();
        matrix.translate(path.bounds.center.x, path.bounds.center.y);
        uiNode.normalizeGeometry( path, matrix ); 
        this.sm.addInstance( uiNode );
        this.pathReferences.push( uiNode );
        newPaths.push( uiNode );
      }
      return newPaths;
    },

    addDelimiterListeners: function( constraintTool, uiNodes ) {
      for (var i = 0; i < uiNodes.length; i++) {
        (function( uiNode ) {
          var geom = uiNode.get('geom');
          if ( geom.name.indexOf('delimit') != 0 ) {
            return;
          }
          geom.onMouseEnter = function( event ) {
            if (!geom.active) {
              geom.strokeColor = '#ff7777';
            }
          }

          geom.onClick = function( event ) {
            uiNode.set('stroke_color', new PColor(255, 0, 0));
            geom.strokeColor = "#ff0000";
            geom.active = true;

            var propSplit = geom.name.split('-');
            propSplit = propSplit.slice( 1, propSplit.length );
            constraintTool.set( 'constrainToVal', propSplit );
            constraintTool.rewordConstraint();
            constraintTool.advance(); 
          }

          geom.onMouseLeave = function( event ) {
            if (!geom.active) {
              geom.strokeColor = '#A5FF00';
            }
          }    
        }(uiNodes[i])) 
      }
    },

    /*
     * Draw rectangles expanded around a reference edge representing 
     * the reference edge weight with as well as minimum, maximum, 
     * and average edge weights for a set of relative instances. The 
     * rectangles should be easily distinguishable from each other.
     * 
     *
     * Name format: delimit-(func)-orientation-(x|y)
     *
     * @param references - reference instances to draw on 
     * @param relatives  - instances to compute properties from
     * @param delimiters - An object containing desired delimiters
     */
    drawWeightDelimiters: function( references, relatives, delimiters ) {
      // draw shapes of delimiter-levels of thickness, different colors around references
    },

    // TODO: figure out how to do this...
    drawStrokeDelimiters: function( references, relatives, delimiters ) {

    },

    // TODO: figure out how to do this...
    drawFillDelimiters: function( references, relatives, delimiters ) {

    },

    /*
     * Remove all Paper UI elements from the canvas, as well as from
     * tracking.
     */
    clear: function() {
      for (var i = 0; i < this.pathReferences.length; i++) {
        this.sm.removeInstance( this.pathReferences[i] );
      }
      this.pathReferences = [];
      this.sm.compile();
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

  return PaperUIHelper;
});
