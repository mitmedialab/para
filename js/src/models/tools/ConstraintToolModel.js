/* ConstraintToolModel.js
 * Model class for the constraint tools, which allows for the creation of basic constraints.
 */

define([
    'underscore',
    'paper',
    'backbone',
    'models/tools/BaseToolModel',
], function(_, paper, Backbone, BaseToolModel) {

  // convenience definitions
  
  // model definition
  var ConstraintToolModel = BaseToolModel.extend({
  
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      ref_shape: null,
      rel_shapes: null,
      props_selected: null,
      props: ['position', 'scale', 'orientation', 'strokeWeight', 'stroke', 'fill'],
      mode: 'select'
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('rel_shapes', []);
      this.set('props_selected', []);
    },

    /*
     * Adds a constraint to the selected set and makes sure that it is accounted for in the UI throughout constraint creation. This includes visualizing alignment lines for position constraints, scale ellipses for scale constraints, etc.
     */
    
    selectConstraint: function( property ) {
      // TODO: change this to adding to current set to allow for more than one selected constraint
      var selected_props = [property];
      this.set('props_selected', selected_props);
      console.log('Selected Constraint Property: ' + property);
    },

    
    /*
     * Clears the UI and current constraint state, setting up for a completely new constraint. Note that this does not change the constraint property; that must be selected on the sidebar.
     */
    
    cancelConstraint: function() {
      // trigger deselection of objects
      // do not change sidebar constraint selections 
      //    possibly remove expression
      //    possibly set type back to equality
    },

    /*
     * Partial undo of constraint process after relative objects have been deselected. It can only occur after relative objects have been selected, and sets the state back as if the reference object had just been selected.
     */
    
    deselectRelatives: function() {
      // relatives = []
      // clear expression 
    },

    /*
     * Changes the constraint in state to reflect the selected comparator (<, =, >).
     */
    setConstraintType: function(type) {

    },

    /*
     * Changes the constraint in state to reflect comparison with the given expression.
     */
    setConstraintExpression: function(exp) {

    },

    /*
     * Chooses the property that will be constrained. Note that these are only fundamental properties, such as position and scale.
     */
    setConstraintProperty: function(prop) {

    },

    /*
     *
     *
     */
    handleSelection: function( instanceList ) {
      // if numObjects = 1 and no reference
      //  set reference to instanceList
      //  set special highlighting for reference
      //  return
      // elif reference
      //  set relatives to instanceList
      //  set special highlighting for relatives
      //  recompute min, max, avg constraints
      //  trigger display min, max, avg constraints
    }
  });

  return ConstraintToolModel;

});  

    
