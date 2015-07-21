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
      mode: 'create',
      applicable: false,

    }),

    /*
     * Sets up the model.
     */
    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('currentConstraint', new Constraint());
      var self = this;
      //this.on('ready:currentConstraint',function(){self.set('applicable',true);});
      this.on('change:currentConstraint', function() {
        self.set('applicable', false);
      });
    },

    start: function() {
      // visitor: get selected constraint
      // if selected
      //  set currentConstraint to selected constraint
      //  set mode to ref
      // else
      //  set mode to create
    },

    mouseDown: function(event) {
      switch (this.get('mode')) {
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
      this.checkPending();
      //code that creates constraint after capslockd

    },

    //checks to see if constraint is currently pending
    checkPending: function() {
      console.log('check pending');
      var constraint = this.get('currentConstraint');
      if (constraint) {
        if (constraint.get('references') && constraint.get('relatives') && constraint.get('ref_prop')&&constraint.get('rel_prop')) {
          this.trigger('constraintPending');
        }
      }
    },

    applyConstraint: function() {
      var constraint = this.get('currentConstraint');
      constraint.matchProperty(constraint.get('ref_prop'), constraint.get('rel_prop'));
      constraint.get('proxy').hide();
      constraint.clearUI();
      constraint.clearSelection();
      constraint.create();
      var constraintMap = this.get('constraints');
      constraintMap[constraint.get('id')] = constraint;
      /*var constraint_data = {
        name: 'constraint',
        id: constraint.get('id'),
        relative: constraint.get('relatives').get('id'),
        reference: constraint.get('references').get('id'),
        ref_prop: constraint.get('ref_prop'),
        rel_prop: constraint.get('rel_prop'),
        ref_prop_key: constraint.get('rel_prop_key'),
        rel_prop_key: constraint.get('rel_prop_key'),
        ref_prop_dimensions: constraint.get('ref_prop_dimensions'),
        rel_prop_dimensions: constraint.get('rel_prop_dimensions'),
        constraint: constraint;
      };*/

      this.set('currentConstraint', new Constraint());
      this.reset();
      this.trigger('compileRequest');
      return constraint;

    },

    modeSwitch: function() {
      var constraint = this.get('currentConstraint');
      switch (this.get('mode')) {
        case 'create':
          break;
        case 'ref':
          // for selected constraints
          //  deselect, set visible on
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


    // TODO: possibly switch creation into two modes, 'createRef' and 'createRel'
    createMouseDown: function(event) {
      // hit test
      //  get all constraints for ref-rel pair
      //  populate constraint selector with prev result
      //  show constraint selector
      //  switch mode to selection
      //  return
      this.set('applicable', true);
      this.trigger('delegateMethod', 'select', 'selectDown', event);
      this.trigger('selectionRequest', this);
      console.log('selection request result', this.selected);
      var type = (event.modifiers.control) ? 'point' : 'shape';
      var flag = this.get('currentConstraint').setSelection(this.selected, type);
      this.trigger('compileRequest');

      if (flag) {
        this.set('mode', 'ref');
        this.modeSwitch();
      } else {
        // visitor get constraints on instance
        // unique constraints by ref
      }
    },

    selectMouseDown: function(event) {
      // hopefully could be here but to get working should be in select view
      // check which constraint was hit
      // set this constraint to selected
      // set current constraint to selected constraint
      // remove visibility of all other constraints ( maybe save for later )
      // set mode to ref 
    },

    refMouseDown: function(event) {
      var constraint = this.get('currentConstraint');
      var relative = constraint.get('relatives');
      this.trigger('delegateMethod', 'select', 'selectDown', event);
      this.trigger('selectionRequest', this);
      console.log('selection request result', this.selected);
      var selected = (this.selected ? this.selected[0] : null); // TODO: really shouldn't have to happen...
      this.trigger('compileRequest');
      if (selected && selected.get('id') == relative.get('id')) {
        this.set('mode', 'rel');
        this.modeSwitch();
      }

    },

    relMouseDown: function(event) {
      var constraint = this.get('currentConstraint');
      var reference = constraint.get('references');
      // this.trigger('delegateMethod', 'select', 'selectDown', event);

      var hitResult = paper.project.hitTest(event.point, mouseHitOptions);
      if (hitResult && hitResult.item.data.instance) {
        if (reference.get('type') === 'collection') {
          if (reference.hasMember(hitResult.item.data.instance, true) ||hitResult.item.data.instance.id == reference.id ) {
            this.set('mode', 'ref');
            this.sm.trigger('compileRequest');

            this.modeSwitch();
            return;
          }
        } else if (hitResult.item.data.instance.id == reference.id) {
          this.set('mode', 'ref');
          this.sm.trigger('compileRequest');

          this.modeSwitch();
          return;
        }
      }
      if (hitResult && hitResult.item.type && hitResult.item.type == 'handle' && hitResult.item.active) {
        this.draggingHandle = constraint.get('rel_prop');
      }
    },

    mouseDrag: function(event) {
      switch (this.get('mode')) {
        case 'rel':
          this.relMouseDrag(event);
          break;
      }
    },


    relMouseDrag: function(event) {
      if (event.modifiers.shift && this.draggingHandle) {
        var constraint = this.get('currentConstraint');
        var proxy = constraint.get('proxy');
        var rel_geom = constraint.get('relatives').get('geom');
        if (proxy instanceof paper.Group) {
          rel_geom = constraint.get('relatives').getInstanceMembers().map(function(instance) {
            return instance.get('geom');
          });
        }
        switch (this.draggingHandle) {
          case 'scale_x':
            if (!(proxy instanceof paper.Group)) {
              var x_scale = 2 * Math.abs(event.point.x - proxy.position.x) / rel_geom.bounds.width;
              proxy.scaling = new paper.Point(x_scale, proxy.scaling.y);
            } else {
              var x_scale = 2 * Math.abs(event.point.x - proxy.children[0].position.x) / rel_geom[0].bounds.width;
              for (var i = 0; i < proxy.children.length; i++) {
                var proxy_child = proxy.children[i];
                var rel_child = rel_geom[i];
                proxy_child.scaling = new paper.Point(x_scale, proxy_child.scaling.y);
              }
            }
            break;
          case 'scale_y':
            if (!(proxy instanceof paper.Group)) {
              var y_scale = 2 * Math.abs(event.point.y - proxy.position.y) / rel_geom.bounds.height;
              proxy.scaling = new paper.Point(proxy.scaling.x, y_scale);
            } else {
              var y_scale = 2 * Math.abs(event.point.y - proxy.children[0].position.y) / rel_geom[0].bounds.height;
              for (var i = 0; i < proxy.children.length; i++) {
                var proxy_child = proxy.children[i];
                var rel_child = rel_geom[i];
                proxy_child.scaling = new paper.Point(proxy_child.scaling.x, y_scale);
              }
            }
            break;
          case 'scale_xy':
            if (!(proxy instanceof paper.Group)) {
              var x_scale = 2 * Math.abs(event.point.x - proxy.position.x) / rel_geom.bounds.width;
              var y_scale = 2 * Math.abs(event.point.y - proxy.position.y) / rel_geom.bounds.height;
              proxy.scaling = new paper.Point(x_scale, y_scale);
            } else {
              var x_scale = 2 * Math.abs(event.point.x - proxy.children[0].position.x) / rel_geom[0].bounds.width;
              var y_scale = 2 * Math.abs(event.point.y - proxy.children[0].position.y) / rel_geom[0].bounds.height;
              for (var i = 0; i < proxy.children.length; i++) {
                var proxy_child = proxy.children[i];
                var rel_child = rel_geom[i];
                proxy_child.scaling = new paper.Point(x_scale, y_scale);
              }
            }
            break;
          case 'position_x':
            if (!(proxy instanceof paper.Group)) {
              proxy.position.x = event.point.x;
            } else {
              var child_pos_delta = proxy.children[0].position.subtract(proxy.position);
              proxy.position.x = event.point.x - child_pos_delta.x;
            }
            break;
          case 'position_y':
            if (!(proxy instanceof paper.Group)) {
              proxy.position.y = event.point.y;
            } else {
              var child_pos_delta = proxy.children[0].position.subtract(proxy.position);
              proxy.position.y = event.point.y - child_pos_delta.y;
            }
            break;
          case 'position_xy':
            if (!(proxy instanceof paper.Group)) {
              proxy.position.x = event.point.x;
              proxy.position.y = event.point.y;
            } else {
              var child_pos_delta = proxy.children[0].position.subtract(proxy.position);
              proxy.position.x = event.point.x - child_pos_delta.x;
              proxy.position.y = event.point.y - child_pos_delta.y;
            }
            break;
          case 'rotation':
            var work_geom = (proxy instanceof paper.Group) ? proxy.children[0] : proxy;
            var angle = event.lastPoint.subtract(work_geom.position).angle;
            var dAngle = event.point.subtract(work_geom.position).angle;
            if (!(proxy instanceof paper.Group)) {
              proxy.rotation = (proxy.rotation + (dAngle - angle));
            } else {
              for (var i = 0; i < proxy.children.length; i++) {
                proxy.children[i].rotation = proxy.children[i].rotation + (dAngle - angle);
              }
            }
            break;
        }

        constraint.get('rel_handle').redraw();
      }
    },

    mouseUp: function(event) {
      switch (this.get('mode')) {
        case 'create':
          this.createMouseUp(event);
          break;
        case 'ref':
          this.refMouseUp(event);
          break;
        case 'rel':
          this.relMouseUp(event);
          break;
      }
    },

    createMouseUp: function(event) {

    },

    refMouseUp: function(event) {

    },

    relMouseUp: function(event) {
      if (this.draggingHandle) {
        var constraint = this.get('currentConstraint');
        var proxy = constraint.get('proxy');
        //constraint.matchProperty(constraint.get('ref_prop'), constraint.get('rel_prop'));
        this.draggingHandle = false;
      }
    },

    /*
     * Resets the state of the constraint tool so that it is as if it has
     * just been selected, or is not selected at all, and removes all UI
     * elements associated with it.
     */
    reset: function() {

      var constraint = this.get('currentConstraint');
      constraint.clearSelection();
      if (constraint.get('references') && constraint.get('relatives')) {
        constraint.clearUI();
      }
      this.set('currentConstraint', new Constraint());
      this.set('mode', 'create');
      this.trigger('constraintReset');
    },



  });



  return ConstraintToolModel;

});