/* ConstraintToolModel.js
 * Model class for the constraint tools, which allows for the creation of basic constraints.
 */

define([
    'underscore',
    'paper',
    'backbone',
    'models/tools/BaseToolModel',
    'utils/PPoint',
    'utils/PaperUI',
    'utils/PaperUIEvents',
    'utils/Utils'
], function(_, paper, Backbone, BaseToolModel, PPoint, PaperUI, PaperUIEvents, Utils) {

  var hitOptions = {
    stroke: true,
    bounds: true,
    center: true,
    tolerance: 3
  };

  var propToConstraintMap = {
    'position': 'translation_delta'
  };

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
      constrainToVal: 0,
      delimited: false
    }),

    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('references', []);
      this.set('relatives', []);
    },

    /*
     * Changes the constraint in state to reflect the selected comparator (<, =, >).
     */
    setConstraintType: function(type) {
      this.set('type', type);
      var result = {};
      result['type'] = type;
      //console.log('Selected Constraint Type: ' + type);
      return type;
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
          this.set('mode', 'value');
          console.log('Advanced constraint tool mode to value');
          break;
        case 'value':
          this.set('mode', 'expression');
          console.log('Advanced constraint tool mode to expression');
          break;
        case 'expression':
          this.createConstraint();
          this.clearState();
          break; 
      }
    },

    referencesSelection: function( instanceList ) {
      if ( instanceList.length > 0 ) {
        this.set('references', instanceList);
      }
    },

    relativesSelection: function( instanceList ) {
      if ( instanceList.length > 0 ) {
        this.set('relatives', instanceList);
      }
    },
    
    createConstraint: function() {
      var constrainToVal = this.get('constrainToVal');
      var references = this.get('references');
      var relatives = this.get('relatives');
      var expression = this.get('expression');

      var refPropList = Utils.getPropConstraintFromList( references, constrainToVal.slice(1, constrainToVal.length) );
      var refProp = refPropList[0];
      console.log('Ref prop: ', refProp);
      var relPropList = Utils.getPropConstraintFromList( relatives, constrainToVal.slice(1, constrainToVal.length) ); 

      var relativeF = function() {
        var x = Utils[constrainToVal[0]]( relPropList.map( function( prop ) { return prop.getValue() }));
        var evaluation = eval( expression );
        console.log('constrained value: ', evaluation);
        refProp.setValue( evaluation );
        return evaluation;  
      };

      refProp.setConstraint( relativeF );
    },

    rewordConstraint: function() {
      var constrainToVal = this.get('constrainToVal');
      for (var i = 0; i < constrainToVal.length; i++) {
        if (constrainToVal[i] in propToConstraintMap) {
          constrainToVal[i] = propToConstraintMap[constrainToVal[i]];
        }
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
          var references = this.get('references'); 
          var relatives = this.get('sm').delegateMethod('select', 'getCurrentSelection');
          this.relativesSelection( relatives );
          //this.get('sm').constrain( references[0], relatives[0] );
          PaperUI.drawPositionDelimiters( references, relatives, {'max-position-x': true, 'max-position-y': true, 'avg-position-x': true, 'avg-position-y': true, 'min-position-x': true, 'min-position-y': true});
          break;
        case 'value':
          var hitResult = paper.project.hitTest(event.point, hitOptions);
          if ( hitResult ) {
            var path = hitResult.item;
            if ( path.name.indexOf( 'delimit' ) == 0 ) {
              var propSplit = path.name.split('-');
              propSplit = propSplit.slice( 1, propSplit.length );
              this.set( 'constrainToVal', propSplit );
              this.rewordConstraint();
            }
          }
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
      
    },

    mouseMove: function(event) {

    },

    clearState: function() {
      this.get('sm').delegateMethod('select', 'resetSelections');
      this.set('references', []);
      this.set('relatives', []);
      this.set('type', 'equal');
      this.set('expression', '');
      this.set('props_selected', []);
      this.set('mode', 'references');
      this.set('maxDelimiter', 0);
      this.set('minDeliiter', 0);
      this.set('avgDelimiter', 0);
      this.set('delimited', false);
      PaperUI.clear();
    }, 
  
    /*
     *  Constraint Tool UI Listeners, passed to Para UI
     */


    /*
     *
     */
    delimiterHighlight: function( event ) {
      var path = event.target;
      // TODO: be pickier about these style changes 
      path.strokeColor = 'red'; 
      path.strokeWidth = 1.3*path.strokeWidth;  
    },

    delimiterSelect: function( event ) {
      var path = event.target;
      // TODO: be pickier about these style changes
      path.strokeColor = 'blue';
      path.strokeWidth = 1.3*path.strokeWidth;
      this.set('constrainToVal', path.getName()); // TODO: implement path.getName, prob by extending Paper path 
    }
  
  });

  



  return ConstraintToolModel;

});  

    
