/* ConstraintToolModel.js
 * Model class for the constraint tools, which allows for the creation of basic constraints.
 * 
 * The constraint tool works by allowing the user to construct a constraint through interaction
 * with the UI in stages, captured in this tool's code as states. The user can move through
 * the process by satisfying the requirements for a stage and then making a definitive indication
 * to the model to move to the next state ( currently, through an 'n' keypress ). Similarly,
 * they can move backwards through a 'b' keypress, or even return the state to the initial
 * by switching off the constraint tool. The stages of interaction are indicated below:
 *
 * 1) 'references': The user, just like with the selection tool, selects a set of instances
 *                  to have their properties constrained.
 *
 * 2) 'property':   Handles show up on a representative of the references selected representing
 *                  each primitive property of instances. The user can select a property 
 *                  by clicking on it; this is the property of the references to constrain.
 *
 * 3) 'relatives':  The user, just like with the selection tool, selects a set of instances
 *                  to have their properties constrained to.
 *
 * 4) 'value':      The exact property to be constrained to for the relatives, based on a function
 *                  operating on a list of their properties, is specified. The exact UI
 *                  corresponding to the property as well as the means of selection vary between 
 *                  properties; using position as an example, the UI elements are dashed horizontal
 *                  and vertical lines at the max, min, and avg x- and y-positions of the relatives.
 *                  Selection is done by clicking on one of the lines.
 *
 * 5) 'expression': The user types in an expression and chooses a relation in the UI elements that
 *                  appear in the Parameters menu. This expression then relates the reference 
 *                  properties to the relative value specified. 
 *
 *
 */

define([
    'underscore',
    'paper',
    'backbone',
    'models/tools/BaseToolModel',
    'utils/PPoint',
    'models/data/PaperUI',
    'utils/PaperUIHelper',
    'utils/PaperUIEvents',
    'utils/Utils',
    'models/data/Constraint',
], function(_, paper, Backbone, BaseToolModel, PPoint, PaperUI, PaperUIHelper, PaperUIEvents, Utils, Constraint) { 

  // hit testing for clicking Paper UI elements
  var hitOptions = {
    stroke: true,
    bounds: true,
    center: true,
    tolerance: 3
  };

  var mouseHitOptions = {
    stroke: true,
    fill: true,
    bounds: true,
    center: true,
    tolerance: 2
  };

  // map property names for UI to instance properties to constrain
  //
  // NOTE: ideally this would be 1-1; i.e. constraining translation_delta
  // would actually constrain position. In reality, an instance's position
  // is based on both an original position AND a translation_delta. Thus
  // making a position constraint really only constrains a delta for now.
  // 
  // UPSHOT: there should be properties on the instance which directly 
  // relate to the properties to be constrained
  var propToConstraintMap = {
    'position': 'translation_delta',
    'scale': 'scaling_delta',
    'orientation': 'rotation_delta'
  };

  // model definition
  var ConstraintToolModel = BaseToolModel.extend({

    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      currentConstraint: null,
      constraints: {},
      mode: 'create'
    }),

    /*
     * Sets up the model.
     */
    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('currentConstraint', new Constraint());
    },

    mouseDown: function(event) {
      switch ( this.get('mode') ) {
        case 'create':
          this.createMouseDown(event);
          break;
        case 'ref':
          this.refMouseDown(event);
          break;
        case 'rel':
          this.relMouseDown(event);
          break;
      }
    },

    modeSwitch: function() {
      var constraint = this.get('currentConstraint');
      switch ( this.get('mode') ) {
        case 'create':
          break;
        case 'ref':
          var arrow = constraint.get('arrow');
          arrow.show();

          var refHandle = constraint.get('ref_handle');
          var relHandle = constraint.get('rel_handle');
          refHandle.show();
          relHandle.show();
          relHandle.hide();
          break;
        case 'rel':
          var proxy = constraint.get('proxy');
          var refHandle = constraint.get('ref_handle');
          var relHandle = constraint.get('rel_handle');
          proxy.show();
          refHandle.hide();
          relHandle.show();
          break;
      }
    },

    createMouseDown: function(event) {
      this.sm.delegateMethod('select', 'selectDown', event);
      var selection = this.sm.delegateMethod('select', 'getCurrentSelection');
      var type = (event.modifiers.control) ? 'point' : 'shape';
      var flag = this.get('currentConstraint').setSelection(selection, type);
      if ( flag ) { 
        this.set('mode', 'ref'); 
        this.modeSwitch();
      }
    },

    refMouseDown: function(event) {
      var constraint = this.get('currentConstraint');
      var relative = constraint.get('relatives');
      var hitResult = paper.project.hitTest( event.point, mouseHitOptions );
      if ( hitResult && hitResult.item.data.instance && hitResult.item.data.instance.id ==  relative.id ) {
        this.set('mode', 'rel');
        this.modeSwitch();  
      }

      // ref wheel handles enter, leave, and click events
    },

    relMouseDown: function(event) {
      var constraint = this.get('currentConstraint');
      var reference = constraint.get('references');
      var hitResult = paper.project.hitTest( event.point, mouseHitOptions );
      if ( hitResult && hitResult.item.data.instance && hitResult.item.data.instance.id == reference.id ) {
        this.set('mode', 'ref');
        this.modeSwitch();
        return;
      }
      if ( hitResult && hitResult.item.type && hitResult.item.type == 'handle' && hitResult.item.active ) {
        this.draggingHandle = constraint.get('rel_prop');
      }
    },

    mouseDrag: function(event) {
      switch( this.get('mode') ) {
        case 'rel':
          this.relMouseDrag(event);
          break;
      }
    },

    relMouseDrag: function(event) {
      if ( event.modifiers.shift && this.draggingHandle ) {
        var constraint = this.get('currentConstraint');
        var proxy = constraint.get('proxy');
        var arrow = constraint.get('arrow');
        var rel_geom = constraint.get('relatives').get('geom');
        switch ( this.draggingHandle ) {
          case 'scale_x':
            var x_scale = 2 * Math.abs(event.point.x - proxy.position.x) / rel_geom.bounds.width;
            proxy.scaling = new paper.Point(x_scale, proxy.scaling.y); 
            break;
          case 'scale_y':
            var y_scale = 2 * Math.abs(event.point.y - proxy.position.y) / rel_geom.bounds.height;
            proxy.scaling = new paper.Point(proxy.scaling.x, y_scale); 
            break;
          case 'scale_xy':
            var x_scale = 2 * Math.abs(event.point.x - proxy.position.x) / rel_geom.bounds.width;
            var y_scale = 2 * Math.abs(event.point.y - proxy.position.y) / rel_geom.bounds.height;
            proxy.scaling = new paper.Point(x_scale, y_scale);
            break;
          case 'position_x':
            proxy.position.x = event.point.x;
            arrow.redrawTail(proxy);
            break;
          case 'position_y':
            proxy.position.y = event.point.y;
            arrow.redrawTail(proxy);
            break;
          case 'position_xy':
            proxy.position.x = event.point.x;
            proxy.position.y = event.point.y;
            arrow.redrawTail(proxy);
            break;
          case 'rotation':
            var angle = event.lastPoint.subtract( proxy.position ).angle;
            var dAngle = event.point.subtract( proxy.position ).angle; 
            proxy.rotation = (proxy.rotation + (dAngle - angle));
            break;
        }

        constraint.get('rel_handle').redraw();
        // check handle being dragged
        // if scale_x
        //   proxy.scaling.x = Math.abs(event.point.x - proxy.position.x) / rel_geom.bounds.width
        // if scale_y
        //   proxy.scaling.y = Math.abs(event.point.y - proxy.position.y) / rel_geom.bounds.height
        // if scale_xy
        //   proxy.scaling.x = Math.abs(event.point.x - proxy.position.x) / rel_geom.bounds.width
        //   proxy.scaling.y = Math.abs(event.point.y - proxy.position.y) / rel_geom.bounds.height
        // if position_x
        //   proxy.position.x = event.point.x
        // if position_y
        //   proxy.position.y = event.point.y
        // if position_xy
        //   proxy.position.x = event.point.x
        //   proxy.position.y = event.point.y
        //   arrow.changeTail(proxy.position)
        // if rotation
        //   proxy.rotation = blablabla
        // rel_handle.redraw()
      }
    },

    mouseUp: function(event) {
    },


    /*
     * Resets the state of the constraint tool so that it is as if it has
     * just been selected, or is not selected at all, and removes all UI 
     * elements associated with it. 
     */
    clearState: function() {
      this.set('current_constraint', null);
      this.set('constraints', {});
    }, 
 
  });

  



  return ConstraintToolModel;

});  

    
