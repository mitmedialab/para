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
      references: null,
      relatives: null,
      type: 'equal',
      expression: '',
      props_selected: null,
      props: ['position', 'scale', 'orientation', 'strokeWeight', 'stroke', 'fill'],
      mode: 'references'
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('references', []);
      this.set('relatives', []);
    },

    /*
     * Adds a constraint to the selected set and makes sure that it is accounted for in the UI throughout constraint creation. This includes visualizing alignment lines for position constraints, scale ellipses for scale constraints, etc.
     */
    
    selectConstraint: function( property ) {
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
      this.set('type', type);
      var result = {};
      result['type'] = type;
      console.log('Selected Constraint Type: ' + type);
      return type;
      // TODO: trigger statemanagermodel update view  
    },

    /*
     * Changes the constraint in state to reflect comparison with the given expression.
     */
    setConstraintExpression: function(exp) {
      // TODO: make expression validation
      var result = {};
      if (this.validate(exp)) {
        this.set('expression', exp);
        result['expression'] = 'true';
        console.log('[INFO] Valid Expression Entered: ' + exp);
      } else {
        result['expression'] = 'false';
        console.log('[INFO] Invalid Expression Entered: ' + exp);
      }
      return result;
      // TODO: trigger statemanagermodel update view, should be highlighting error
    },

    validate: function(exp) {
      return true;
    },

    /*
     * Chooses the property that will be constrained. Note that these are only fundamental properties, such as position and scale.
     */
    setConstraintProperty: function(property) {
      // TODO: change this to adding to current set to allow for more than one selected constraint
      var selected_props = [property];
      var result = {};
      result['property'] = property;
      this.set('props_selected', selected_props);
      console.log('Selected Constraint Property: ' + property);
      return result;
      // TODO: trigger statemanagermodel update view
    },

    /*
     *
     *
     */
    handleSelection: function( instanceList ) {
        // TODO: trigger statemanagermodel update view, special box highlighting for ref shape
        // TODO: trigger statemanagermodel update view, special box highlighting for rel shapes
      if (this.get('references').length == 0) {
        this.set('references', instanceList);
      } else {
        this.set('relatives', instanceList);
      }
      // if numObjects = 1 and no reference
      //  set reference to instanceList
      //  set special highlighting for reference
      //  return
      // elif reference
      //  set relatives to instanceList
      //  set special highlighting for relatives
      //  recompute min, max, avg constraints
      //  trigger display min, max, avg constraints
    },

    referencesSelection: function( instanceList ) {
      if ( instanceList.length > 0 ) {
        this.set('references', instanceList);
      }
    },

    /*
     * Make sure the tool has a state which is workable. That is, relatives should not exist without references, etc.
     */
    validateState: function() {

    },

    advance: function() {
      var state = this.get('mode');
      switch ( state ) {
        case 'references':
          this.get('sm').delegateMethod('select', 'saveSelection');
          this.set('mode', 'property');
          console.log('Advanced constraint tool mode to property');
          break;
        case 'property':
          this.set('mode', 'relatives');
          console.log('Advanced constraint tool mode to relatives');
          break;
        case 'relatives':
          this.set('mode', 'type');
          console.log('Advanced constraint tool mode to type');
          break;
        case 'type':
          this.set('mode', 'expression');
          break;
        case 'expression':
          var result = this.createConstraint();
          if ( result ) {
            this.get('sm').delegateMethod('select', 'resetSelections');
            this.set('mode', 'references');
          }
          break; 
      }
    },

    relativesSelection: function( instanceList ) {
      if ( instanceList.length > 0 ) {
        this.set('relatives', instanceList);
      }
    },

    mouseDown: function(event) {
      var state = this.get('mode');
      switch ( state ) {
        case 'references':
          // TODO: check if selection already exists, set to references if so, OR clear selections when constraint tool selected
          var sm = this.get('sm');
          this.get('sm').delegateMethod('select', 'mouseDown', event);
          var references = this.get('sm').delegateMethod('select', 'getCurrentSelection');
          this.referencesSelection( references );
          break;
        case 'relatives':
          this.get('sm').delegateMethod('select', 'mouseDown', event);
          var relatives = this.get('sm').delegateMethod('select', 'getCurrentSelection');
          this.relativesSelection( relatives );
          break;
        case 'type':
          // TODO: check if type button has been clicked
          break;
        case 'expression':
          // TODO: check if expression has been submitted?
          break; 
      } 
    
    },

    mouseDrag: function(event) {
            
    },

    dblClick: function(event) {
      
    },

    mouseUp: function(event) {
      
    } 
  });

  return ConstraintToolModel;

});  

    
