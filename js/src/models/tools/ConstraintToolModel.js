/* ConstraintToolModel.js
 * Model class for the constraint tools, which allows for the creation of basic constraints.
 */

define([
    'underscore',
    'paper',
    'backbone',
    'models/tools/BaseToolModel',
    'utils/PPoint',
], function(_, paper, Backbone, BaseToolModel, PPoint) {

  
  // convenience definitions
  Math.avg = function( valArray ) {
    var sum = valArray.reduce( function(a, b) { return a + b });
    var avg = sum / valArray.length;
    return avg;
  }

  // model definition
  var ConstraintToolModel = BaseToolModel.extend({
  
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      references: null,
      relatives: null,
      type: 'equal',
      expression: '',
      props_selected: null,
      props: ['position', 'scale', 'orientation', 'strokeWeight', 'stroke', 'fill'],
      mode: 'references',
      maxDelimiter: 0,
      minDelimiter: 0,
      avgDelimiter: 0,
      delimited: false
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

    drawDelimiters: function() {
      
    },

    drawPositionDelimiters: function() {

    },

    drawScaleDelimiters: function() {

    },

    drawStrokeWeightDelimiters: function() {

    },

    drawOrientationDelimiters: function() {

    },

    drawStrokeDelimiters: function() {

    },

    drawFillDelimiters: function() {

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

    computeConstraintDelimiters: function() {
      var relatives = this.get( 'relatives' );
      var property = this.get( 'props_selected' )[0];
      console.log('Got property name: ' + property);
      var propValues = relatives.map( function( instance ) {
        return instance.get(property);
      });
      this.computeRepProperties( relatives, property );
      this.set('delimited', true);
      console.log('MaxDelimiter set to: ' + this.get('maxDelimiter').x);
      console.log('MinDelimiter set to: ' + this.get('minDelimiter').y);
      console.log('AvgDelimiter set to: ' + this.get('avgDelimiter').x); 
    },

    computeRepProperties: function( instanceList, property ) {
      switch (property) {
        case 'position':
          console.log(instanceList[0]);
          var positionsX = instanceList.map( function( instance ) {
            return instance.accessProperty('position').x;
          });
          console.log('PositionsX: ' + positionsX[0]);
          var positionsY = instanceList.map( function( instance ) {
            return instance.accessProperty('position').y;
          });
          this.set('maxDelimiter', new PPoint(Math.max( positionsX ), Math.max( positionsY )));
          this.set('minDelimiter', new PPoint(Math.min( positionsX ), Math.min( positionsY )));
          this.set('avgDelimiter', new PPoint(Math.avg( positionsX ), Math.avg( positionsY )));
          break;
        case 'orientation':
          break;
        case 'scale':
          break;
        case 'strokeWeight':
          break;
        case 'stroke':
          break;
        case 'fill':
          break;
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
          this.computeConstraintDelimiters();
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

    
