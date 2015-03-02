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
  'utils/PaperUI',
  'utils/PaperUIEvents',
  'utils/Utils'
], function(_, paper, Backbone, BaseToolModel, PPoint, PaperUI, PaperUIEvents, Utils) {

  // hit testing for clicking Paper UI elements
  var hitOptions = {
    stroke: true,
    bounds: true,
    center: true,
    tolerance: 3
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

    /*
     * Creates attributes on the model for keeping track of the model's
     * state.
     */
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      references: null, // list of reference instances
      relatives: null, // list of relative instances
      type: 'equal', // relation for constraint
      expression: '', // the entered constraint expression
      props_selected: null, // a list of properties to be constrained
      mode: 'references', // indicator for current state
      constrainToVal: [], // array for specifying value constrained to
    }),

    /*
     * Sets up the model.
     */
    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
      this.set('references', []);
      this.set('relatives', []);
    },

    /*
     * Changes the constraint in state to reflect the selected relation (<, =, >).
     * Currently only these three relations are supported, with names:
     * 'less', 'equal', 'more'
     * For convenience, they correspond to ids of UI elements.
     *
     * @param type - string for relation name
     */
    setConstraintType: function(type) {
      this.set('type', type);
      var result = {};
      result['type'] = type;
      console.log('[INFO] Selected Constraint Type: ' + type);
      return type;
    },

    /*
     * Changes the constraint in state to reflect comparison with the given expression.
     * The expression is first validated and then set.
     *
     * @param exp - a string for the expression
     */
    setConstraintExpression: function(exp) {
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

    /*
     * Validates the expression passed so that a constraint can be made.
     * Validation should ensure that no injections are being made,
     * since eval is used to evaluate the expression; it should also
     * ensure that the expression is mathematically valid.
     *
     * @param exp - a string for the expression to validate
     *
     * TODO: IMPLEMENT THIS FUNCTION
     */
    validate: function(exp) {
      return true;
    },

    /*
     * Sets the property that will be constrained in state. Note that
     * these are only fundamental properties, such as position and scale.
     *
     * @param property - string for the name of the property to constrain
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
     * Make sure the tool has a state which is workable. That is, relatives
     * should not exist without references, etc.
     *
     * TODO: IMPLEMENT THIS FUNCTION
     */
    validateState: function() {

    },

    /*
     * Move the state of the tool forward to allow for the next stage
     * in constraint creation. Ensures that the current state's info
     * is saved into state so that the next stage is meaningful.
     *
     */
    advance: function() {
      var state = this.get('mode');
      switch (state) {
        case 'references':
          this.get('sm').delegateMethod('select', 'saveSelection');
          this.set('mode', 'property');
          console.log('[INFO] Advanced constraint tool mode to property');
          break;
        case 'property':
          this.set('mode', 'relatives');
          console.log('[INFO] Advanced constraint tool mode to relatives');
          break;
        case 'relatives':
          this.set('mode', 'value');
          console.log('[INFO] Advanced constraint tool mode to value');
          break;
        case 'value':
          this.set('mode', 'expression');
          console.log('[INFO] Advanced constraint tool mode to expression');
          break;
        case 'expression':
          this.createConstraint();
          this.clearState();
          console.log('[INFO] Reset constraint tool state');
          break;
      }
    },

    /*
     * Takes a list of instances, checks their validity, and sets them
     * in the constraint tool reference state.
     *
     * @param instanceList - a list of instances
     */
    referencesSelection: function(instanceList) {
      if (instanceList.length > 0) {
        this.set('references', instanceList);
      }
    },

    /*
     * Takes a list of instances, checks their validity, and sets them
     * in the constraint tool relatives state.
     *
     * @param instanceList - a list of instances
     */
    relativesSelection: function(instanceList) {
      if (instanceList.length > 0) {
        this.set('relatives', instanceList);
      }
    },

    /*
     * Uses the constraint tool state which has been specified through
     * the stages of interaction to construct the constraint on the
     * references and relatives as desired.
     */
    createConstraint: function() {
      var constrainToVal = this.get('constrainToVal');
      var references = this.get('references');
      var relatives = this.get('relatives');
      var expression = this.get('expression');
      var sampler = references[0].getSampler();

      if (relatives[0].get('type') === 'sampler') {
        var refP = references[0].inheritProperty('translation_delta');
        var relativeS = function() {
          var x = relatives[0].sample();
          //console.log('x=', x);
          /*if (sampler) {
           relatives[0].setValue(sampler.getValue());
          }*/
          var evaluation = eval(expression);
          refP.setValue(evaluation);
          return evaluation;
        };
        refP.setConstraint(relativeS);
      } else {

        var refPropList = Utils.getPropConstraintFromList(references, constrainToVal.slice(1, constrainToVal.length));
        var refProp = refPropList[0];
        var relPropList = Utils.getPropConstraintFromList(relatives, constrainToVal.slice(1, constrainToVal.length));
        console.log("relList", relPropList, "refProp", refProp);

        var relativeF = function() {
          var x = Utils[constrainToVal[0]](relPropList.map(function(prop) {
            return prop.getValue();
          }));
          if (sampler) {
            var i = sampler.getValue();


          }
          var evaluation = eval(expression);
          refProp.setValue(evaluation);
          return evaluation;
        };

        refProp.setConstraint(relativeF);
      }


      /* 
      var relDeltaList = Utils.getPropConstraintFromList( relatives, rewordToVal.slice(1, rewordToVal.length) );
      var relativeDeltaF = function() {
        var x = Utils[rewordToVal[0]]( relDeltaList.map( function( prop ) { return prop.getValue() }));
        var evaluation = eval( expression );
        refDelta.setValue( evaluation );
        return evaluation; 
      };

      refDelta.setConstraint( relativeF );*/
    },

    /* createListConstraint: function(){

       var constrainToVal = this.get('constrainToVal');
       var references = this.get('references');
       var relatives = this.get('relatives');
       var expression = this.get('expression');
       var sampler = references[0].getSampler();

       var refPropList = Utils.getPropConstraintFromList( references, constrainToVal.slice(1, constrainToVal.length) );
       var refProp = refPropList[0];
       var relPropList = Utils.getPropConstraintFromList( relatives, constrainToVal.slice(1, constrainToVal.length) ); 
       console.log("relList",relPropList,"refProp",refProp);

       var relativeF = function() {
         var x = Utils[constrainToVal[0]]( relPropList.map( function( prop ) { return prop.getValue(); }));
         var i = sampler.getValue();
         var evaluation = eval( expression );
         refProp.setValue( evaluation );
         return evaluation;  
       };

       refProp.setConstraint(relativeF);
     },*/

    /*
     * Rewords the specified value to be constrained to (a property list)
     * so that the terms used in the UI (scale, position) map to instance
     * properties.
     *
     * NOTE: Ideally, this should never have to be used.
     */
    rewordConstraint: function() {
      var constrainToVal = this.get('constrainToVal');
      for (var i = 0; i < constrainToVal.length; i++) {
        if (constrainToVal[i] in propToConstraintMap) {
          constrainToVal[i] = propToConstraintMap[constrainToVal[i]];
        }
      }
    },

    /*
     * Handles mouseDown events on the canvas when the constraint tool is
     * being used. For each different state of the tool, the event is
     * handled appropriately.
     *
     * state 'references': delegate mouseDown events to the selection tool
     *                     for selection of reference instances
     *
     * state 'property':   do nothing
     *
     * state 'relatives':  delegate mouseDown events to the selection tool
     *                     for selection of relative instances
     *
     * state 'value':      test for hits on UI elements that specify value
     *                     to constrain to
     *
     * state 'expression': do nothing
     */
    mouseDown: function(event) {
      var state = this.get('mode');
      switch (state) {
        case 'references':
          // TODO: check if selection already exists, set to references if so, OR clear selections when constraint tool selected
          var sm = this.get('sm');
          this.get('sm').delegateMethod('select', 'mouseDown', event);
          var references = this.get('sm').delegateMethod('select', 'getCurrentSelection');
          this.referencesSelection(references);
          break;
        case 'relatives':
          this.get('sm').delegateMethod('select', 'mouseDown', event);
          var references = this.get('references');
          var relatives = this.get('sm').delegateMethod('select', 'getCurrentSelection');
          this.relativesSelection(relatives);
          //this.get('sm').constrain( references[0], relatives[0] );
          PaperUI.drawPositionDelimiters(references, relatives, {
            'max-translation_delta-x': true,
            'max-translation_delta-y': true,
            'avg-translation_delta-x': true,
            'avg-translation_delta-y': true,
            'min-translation_delta-x': true,
            'min-translation_delta-y': true
          });
          break;
        case 'value':
          var hitResult = paper.project.hitTest(event.point, hitOptions);
          if (hitResult) {
            var path = hitResult.item;
            if (path.name.indexOf('delimit') === 0) {
              var propSplit = path.name.split('-');
              propSplit = propSplit.slice(1, propSplit.length);
              this.set('constrainToVal', propSplit);
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

    /*
     * Resets the state of the constraint tool so that it is as if it has
     * just been selected, or is not selected at all, and removes all UI
     * elements associated with it.
     */
    clearState: function() {
      this.get('sm').delegateMethod('select', 'resetSelections');
      this.set('references', []);
      this.set('relatives', []);
      this.set('type', 'equal');
      this.set('expression', '');
      this.set('props_selected', []);
      this.set('mode', 'references');
      PaperUI.clear();
    },



    /*
     *  Constraint Tool UI Listeners, passed to Para UI
     */

    /*
     *
     */
    delimiterHighlight: function(event) {
      var path = event.target;
      // TODO: be pickier about these style changes 
      path.strokeColor = 'red';
      path.strokeWidth = 1.3 * path.strokeWidth;
    },

    /*
     *
     */
    delimiterSelect: function(event) {
      var path = event.target;
      // TODO: be pickier about these style changes
      path.strokeColor = 'blue';
      path.strokeWidth = 1.3 * path.strokeWidth;
      this.set('constrainToVal', path.getName()); // TODO: implement path.getName, prob by extending Paper path 
    }

  });



  return ConstraintToolModel;

});