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
  'models/data/PaperUIItem',
], function($, _, paper, Utils, PColor, PaperUI, PaperUIItem) {
 
  
  var PaperUIHelper = {
    dashArray: [10, 12],      // a default dash array for UI

    sm: null,
    pathReferences: [],       // a list of references to UI objects
                              // useful for redrawing and clearing
                              // TODO: use named UI elements instead


    setup: function( sm ) {
      this.sm = sm;
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
      var ref_positions = getPropFromList( references, 'translationDelta' );
      var rel_positions = getPropFromList( relatives, 'translationDelta' );
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
    drawPositionDelimiters: function( instances, instancesName, delimiters ) {
      var newPaths = [];
      // go through each delimiter and draw a line if the
      // delimiter is in the delimiters object
      for ( property in delimiters ) {
        // split the delimiter into pieces for function and property
        var property_split = property.split('-');
        var func = property_split[0];
        var axis = property_split[property_split.length - 1];

        // compute the value to draw for
        var value = Utils[func]( Utils.getPropFromList( instances, property_split.slice(1, property_split.length) ) );

       
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
        
        // NOTE: be careful about instancesName containing '-' 
        path.name = instancesName + '-delimit-' + property;
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
    drawScaleDelimiters: function( instances, instancesName, delimiters ) {
    
      // NOTE: only works on one instance
      var geom  = instances[0].get('geom'); 
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
            segments: [[geom.bounds.x - .2 * geom.bounds.width, geom.bounds.y - .1 * geom.bounds.height], [geom.bounds.x + 1.2 * geom.bounds.width, geom.bounds.y - .1 * geom.bounds.height]]
          });
        }

        if ( axis == 'y' ) {
          path = new paper.Path({
            segments: [[geom.bounds.x + 1.1 * geom.bounds.width, geom.bounds.y - .2 * geom.bounds.height], [geom.bounds.x + 1.1 * geom.bounds.width, geom.bounds.y + 1.2 * geom.bounds.height]]
          });
        }
       
        path.name = instancesName + '-delimit-' + property;
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
    drawOrientationDelimiters: function( instances, instancesName, delimiters ) {
      // draw dashed circle with arrows for each orientation
      
      // NOTE only works for one instance
      var geom = instances[0].get('geom'); 
      var newPaths = [];
      
      var center = new paper.Point( geom.bounds.x + geom.bounds.width / 2, geom.bounds.y + geom.bounds.height / 2 );
      var radius = 1.1 * Utils.max(geom.bounds.width / 2, geom.bounds.height / 2);
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
        var orientation = Utils[func]( Utils.getPropFromList( instances, property_split.slice(1, property_split.length) ) );

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

        path.name = instancesName + '-delimit-' + property;
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
          var nameSplit = geom.name.split('-');

          if ( nameSplit[1] != 'delimit' ) {
            return;
          }
          geom.onMouseEnter = function( event ) {
            if (!geom.active) {
              geom.strokeColor = '#ff7777';
            }
          }

          geom.onClick = function( event ) {
            uiNode.set('strokeColor', new PColor(255, 0, 0));
            geom.strokeColor = "#ff0000";
            geom.active = true;

            propSplit = nameSplit.slice( 2, nameSplit.length );
            constraintTool.set( nameSplit[0], propSplit );
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

    delimiterFunctions: {
      setTentative: function( geom, color ) {

      },

      setActive: function( geom, color ) {

      },

      removeTentative: function( geom ) {

      },

      setDownPoint: function( geom, event ) {

      },

      checkClick: function( geom, event ) {

      }
    },

    addPositionRefListeners: function( constraintTool, posDelimNodes ) {
      // have to do x and y sep
      // on mouse down, change constraint tool mousemove
      //  if x delim mousemove checks x change
      //  if y delim mousemove checks y change
      // on mouse up, reset constraint tool mousemove
      //  get change, update expression and constraintTo/FromVal
      //
      var enterColorChange = function( geom ) { 
        if ( !geom.active ) { geom.strokeColor = '#ff7777'; }
      }

      var leaveColorChange = function( geom ) {
        if ( !geom.active ) { geom.strokeColor = '#A5FF00'; }
      }      

      var setActive = function( uiNode ) {
        uiNode.set('strokeColor', new PColor(255, 0, 0));
        var geom = uiNode.get('geom');
        var nameSplit = geom.name.split('-');
        geom.strokeColor = '#ff0000';
        geom.active = true;

        propSplit = nameSplit.slice( 2, nameSplit.length );
        constraintTool.set( nameSplit[0], propSplit );
        constraintTool.rewordConstraint();
      }

      var mouseDown = function( event ) {
        // set constraint tool mouse move
        //
      }

      var mouseUp = function( event ) {
        // if up point is same as down point
        //  setActive
        //  draw flashing rel at new point? or flashing update rel pos to new point? (TEMP)
        // reset constraint tool mouse move
      }
    },

    addScaleRefListeners: function( constraintTool, scaleDelimNodes ) {

    },

    addOrientationRefListeners: function( constraintTool, rotDelimNodes ) {

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

    createConstraintWheel: function( instances, name ) {
      // create paper path for constraint wheel
      var wheelPath = paper.project.importSVG($('#constraint-wheel-box').get(0));
        
      // translate center to corner of bounding box
      // TODO: more than just one instance
      var instance = instances[0].get('geom');
      var wheelCenter = new paper.Point(wheelPath.bounds.x + wheelPath.bounds.width / 2, wheelPath.bounds.y + wheelPath.bounds.height / 2);
      wheelPath.scale( 0.6, wheelCenter );
      wheelPath.translate( instance.bounds.x + instance.bounds.width - wheelCenter.x, instance.bounds.y - wheelCenter.y );
      wheelPath.name = name;
      var uiNode = this.createUINodeFromPath( wheelPath );
      return [uiNode]; 
    },

    addConstraintWheelHandlers: function( constraintTool, refWheel, relWheel ) {
      
      // for each highest level part
      // onMouseEnter turn pink (inactive)
      // onMouseClick turn red and send prop to ctool
      // onMouseLeave turn to normal (inactive)

      var ref_wheel_container = refWheel.get('geom');
      var rel_wheel_container = relWheel.get('geom');
      var ref_true_wheel = ref_wheel_container.children[0];
      var rel_true_wheel = rel_wheel_container.children[0];
      var ui_handler = this;
      for (var i = 0; i < ref_true_wheel.children.length; i++) {
        (function( ref_wheel_group, rel_wheel_group ) {

          ref_wheel_group.originalFill = ref_wheel_group.fillColor;
          rel_wheel_group.originalFill = ref_wheel_group.fillColor;
          ref_wheel_group.originalStroke = rel_wheel_group.strokeColor;
          rel_wheel_group.originalStroke = rel_wheel_group.strokeColor;
          
          if ( ref_wheel_group.name == 'position' ) {
            ref_wheel_group.strokeColor = '#ff0000';
            ref_wheel_group.fillColor = '#ff0000';
            ref_wheel_group.active = true;
            constraintTool.setConstraintProperty( 'reference', ref_wheel_group.name );
          }

          if ( rel_wheel_group.name == 'position' ) {
            rel_wheel_group.strokeColor = '#ff0000';
            rel_wheel_group.fillColor = '#ff0000';
            rel_wheel_group.active = true;
            constraintTool.setConstraintProperty( 'relative', rel_wheel_group.name );
          }

          ref_wheel_group.onMouseEnter = function( event ) {
            if (!ref_wheel_group.active) {
              ref_wheel_group.strokeColor = '#ff7777';
              ref_wheel_group.fillColor = '#ff7777';
            }
          }

          rel_wheel_group.onMouseEnter = function( event ) {
            if (!rel_wheel_group.active) {
              rel_wheel_group.strokeColor = '#ff7777';
              rel_wheel_group.fillColor = '#ff7777';
            }
          }

          ref_wheel_group.onMouseLeave = function( event ) {
            if (!ref_wheel_group.active) {
              ref_wheel_group.strokeColor = ref_wheel_group.originalStroke;
              ref_wheel_group.fillColor = ref_wheel_group.originalFill;
            }
          }

          rel_wheel_group.onMouseLeave = function( event ) {
            if (!rel_wheel_group.active) {
              rel_wheel_group.strokeColor = rel_wheel_group.originalStroke;
              rel_wheel_group.fillColor = rel_wheel_group.originalFill;
            }
          }
              
          ref_wheel_group.onClick = function( event ) {
           
            for ( var j = 0; j < ref_true_wheel.children.length; j++ ) {
              ref_true_wheel.children[j].strokeColor = ref_true_wheel.children[j].originalStroke;
              ref_true_wheel.children[j].fillColor = ref_true_wheel.children[j].originalFill;
              rel_true_wheel.children[j].strokeColor = rel_true_wheel.children[j].originalStroke;
              rel_true_wheel.children[j].fillColor = rel_true_wheel.children[j].originalFill;
              ref_true_wheel.children[j].active = rel_true_wheel.children[j].active = false;
            }
             
            ref_wheel_group.strokeColor = '#ff0000';
            ref_wheel_group.fillColor = '#ff0000';
            ref_wheel_group.active = true;

            rel_wheel_group.strokeColor = '#ff0000';
            rel_wheel_group.fillColor = '#ff0000';
            rel_wheel_group.active = true;
          
            
            constraintTool.setConstraintProperty( 'reference', ref_wheel_group.name );
            constraintTool.setConstraintProperty( 'relative', rel_wheel_group.name );

            constraintTool.removeDelimiters( 'reference' );
            constraintTool.removeDelimiters( 'relative' );
            
            //var delimiters = constraintTool.createDelimiters( 'reference' );
            /*
            ui_handler.addDelimiterListeners( constraintTool, delimiters, 'reference' );
            */
          }     

          rel_wheel_group.onClick = function( event ) {

            for ( var j = 0; j < ref_true_wheel.children.length; j++ ) {
              rel_true_wheel.children[j].strokeColor = rel_true_wheel.children[j].originalStroke;
              rel_true_wheel.children[j].fillColor = rel_true_wheel.children[j].originalFill;
              rel_wheel_group.active = false;
            }
            
            rel_wheel_group.strokeColor = '#ff0000';
            rel_wheel_group.fillColor = '#ff0000';
            rel_wheel_group.active = true;

            constraintTool.setConstraintProperty( 'relative', rel_wheel_group.name );
           
            // TODO: figure out how these delimiter listeners work
            constraintTool.removeDelimiters( 'reference' ); 
            constraintTool.removeDelimiters( 'relative' );
            /*
            var ref_delimiters = constraintTool.createDelimiters( 'reference' );
            var rel_delimiters = constraintTool.createDelimiters( 'relative' );
            ui_handler.addDelimiterListeners( constraintTool, delimiters, 'relative' );
            */
          }

        }( ref_true_wheel.children[i], rel_true_wheel.children[i] ))
      }

      var ref_delimiters = constraintTool.createDelimiters( 'reference' );
      ui_handler.addDelimiterListeners( constraintTool, ref_delimiters, 'reference' );
    },

    createUINodeFromPath: function( path ) {
      var uiNode;
      // TODO: fix hacky way of dealing with items as opposed to strict paths
      if ( !path.segments || !path.fillColor ) {
        uiNode = new PaperUIItem();
      } else {
        uiNode = new PaperUI();
      }
      var matrix = new paper.Matrix();
      matrix.translate(path.bounds.center.x, path.bounds.center.y);
      uiNode.normalizeGeometry( path, matrix ); 
      this.sm.addInstance( uiNode );
      this.pathReferences.push( uiNode );
      return uiNode;
    },

    remove: function( uiNode ) {
      for ( var i = 0; i < this.pathReferences.length; i++ ) {
        if ( this.pathReferences[i].get('geom').name == uiNode.get('geom').name ) { this.pathReferences.splice(i, 1); }
      }
      this.sm.deleteInstance( uiNode );
    },
    /*
     * Remove all Paper UI elements from the canvas, as well as from
     * tracking.
     */
    clear: function() {
      for (var i = 0; i < this.pathReferences.length; i++) {
        this.sm.deleteInstance( this.pathReferences[i] );
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
    
    }
  };

  return PaperUIHelper;
});
