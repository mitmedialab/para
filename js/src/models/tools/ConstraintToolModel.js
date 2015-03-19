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
    'utils/PaperUIHelper',
    'utils/PaperUIEvents',
    'utils/Utils'
], function(_, paper, Backbone, BaseToolModel, PPoint, PaperUIHelper, PaperUIEvents, Utils) {

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


    //  getSelectionByMouse(event)
    //    finds the smallest active selection containing the given mouse pos
    //    returns null if none
    //  mouseDown
    //    ref = getSelectionByMouse
    //    references = ref (if not null)
    //  mouseUp
    //    rel = getSelectionByMouse
    //    relatives = rel (if not null)
    //    clearPreviousConstraint (if not null)
    //    startConstraint (if not null)
    //  startConstraint
    //    show ref and rel wheels, default position
    //    show ref pos delimiters
    //  clearPrevConstraint
    //    remove ref&rel wheels
    //    remove ref and rel delimiters
    //  createConstraint
    //    establish constraint, current code


    /*
     * Creates attributes on the model for keeping track of the model's
     * state.
     */
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {
      references: null,       // list of reference instances
      relatives: null,        // list of relative instances
      type: 'equal',          // relation for constraint
      expression: '',         // the entered constraint expression
      ref_prop: null,         // the property of the references to be constrained
      rel_prop: null,         // the property of the relatives to be mode: 'references',     // indicator for current state
      constrainFromVal: null,     // array for specifying value constrained to
      constrainToVal: null,

      arrow: null,
      uiElements: {'ref_delimiters': [], 'rel_delimiters': [], 'arrows': []}
    }),

    /*
     * Sets up the model.
     */
    initialize: function() {
      BaseToolModel.prototype.initialize.apply(this, arguments);
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
      this.advance(); // slightly hacky
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
    setConstraintProperty: function(relevance, property) {
      var internal_prop;
      if ( relevance == 'reference' ) { 
        internal_prop = 'ref_prop';
      } else if ( relevance == 'relative' ) {
        internal_prop = 'rel_prop';
      }
      
      this.set(internal_prop, property);
      console.log('[INFO] Selected Constraint Property: ' + property);
      //this.advance();
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
      switch ( state ) {
        case 'references':
          this.get('sm').delegateMethod('select', 'saveSelection');
          this.set('mode', 'ref_prop');
          var ref_wheel = PaperUIHelper.createConstraintWheel( this.get('references'), 'ref-wheel' )[0];
          PaperUIHelper.addConstraintWheelHandlers( this, ref_wheel );
          console.log('[INFO] Advanced constraint tool mode to ref_prop');
          break;
        case 'ref_prop':
          this.set('mode', 'ref_value');
          console.log('[INFO] Advanced constraint tool mode to ref_value');
          break;
        case 'ref_value':
          this.set('mode','relatives');
          console.log('[INFO] Advanced constraint tool mode to relatives');
          break;
        case 'relatives':
          this.set('mode', 'rel_prop');
          var rel_wheel = PaperUIHelper.createConstraintWheel( this.get('relatives'), 'rel-wheel' )[0];
          PaperUIHelper.addConstraintWheelHandlers( this, rel_wheel );
          console.log('[INFO] Advanced constraint tool mode to rel_prop');
          break;
        case 'rel_prop':
          this.set('mode', 'rel_value');
          console.log('[INFO] Advanced constraint tool mode to rel_value');
          break;
        case 'rel_value':
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
     *
     *
     *
     */
    retreat: function() {
      var state = this.get('mode');
      switch ( state ) {
        case 'expression':
          this.removeDelimiters();
          console.log('[INFO] Retreated and deselected delimiter');
          break;
        case 'value':
          this.deselectRelatives();
          console.log('[INFO] Retreated and deslected relatives');
          break;
        case 'relatives':
          this.deselectProperty();
          console.log('[INFO] Retreated and deselected property');
          break;
        case 'ref_prop':
          this.deselectReferences();
          console.log('[INFO] Retreated and deselected references');
          break;
      }
    },

    /*
     * Takes a list of instances, checks their validity, and sets them 
     * in the constraint tool reference state.
     *
     * @param instanceList - a list of instances
     */
     selectReferences: function( instanceList ) {
      if ( instanceList.length > 0 ) {
        this.set('references', instanceList);
        // this.sm.delegateMethod('select', 'setSelectionColor', color);
      }
    },

    /*
     * Takes a list of instances, checks their validity, and sets them 
     * in the constraint tool relatives state.
     *
     * @param instanceList - a list of instances
     */
    selectRelatives: function( instanceList ) {
      if ( instanceList.length > 0 ) {
        this.set('relatives', instanceList);
        // this.sm.delegateMethod('select', 'setSelectionColor', color);
      }
    },

    deselectReferences: function() {
      this.sm.delegateMethod('select', 'deselectCurrent');
      this.set('references', []);
    },

    deselectRelatives: function() {
      this.sm.delegateMethod('select', 'deselectCurrent');
      this.set('relatives', []);
    },
   
    deselectProperty: function() {
      // reset UI element
      this.set('ref_prop', []);
    },

    createDelimiters: function( relevance ) {
      // get props selected, stick function names in front, delegate to PaperUIHelper, store results
      var instances;
      var instancesName;
      var property;
      var delimsName;
      if ( relevance == 'reference' ) {
        instances = this.get('references');
        instancesName = 'constrainFromVal';
        property = this.get('ref_prop');
        delimsName = 'ref_delimiters';
      } else if ( relevance == 'relative' ) {
        instances = this.get('relatives');
        instancesName = 'constrainToVal';
        property = this.get('rel_prop');
        delimsName = 'rel_delimiters';
      }
      
      var delimiters;
      switch ( property ) {
        case 'position':
          var pos_delim_ind = {'avg-translation_delta-x': true, 'avg-translation_delta-y': true};
          delimiters = PaperUIHelper.drawPositionDelimiters( instances, instancesName, pos_delim_ind );
          break;
        case 'scale':
          var scale_delim_ind = {'avg-scaling_delta-x': true, 'avg-scaling_delta-y': true};
          delimiters = PaperUIHelper.drawScaleDelimiters( instances, instancesName, scale_delim_ind ); 
          break;
        case 'orientation':
          var orient_delim_ind = {'avg-rotation_delta': true};
          delimiters = PaperUIHelper.drawOrientationDelimiters( instances, instancesName, orient_delim_ind );
      }
      
      var uiElements = this.get('uiElements');
      uiElements[delimsName].push.apply(uiElements[delimsName], delimiters);
      this.set('uiElements', uiElements);
      return delimiters;
    },

    removeDelimiters: function( relevance ) {
      var uiElements = this.get('uiElements');
      var delims_name, delimiters;
      if ( relevance == 'reference' ) { 
        delims_name = 'ref_delimiters';
      } else if ( relevance == 'relative' ) {
        delims_name = 'rel_delimiters';
      }
      delimiters = uiElements[delims_name];
      for (var i = 0; i < delimiters.length; i++) {
        PaperUIHelper.remove(delimiters[i]);
      }
      delimiters = [];
      uiElements[delims_name] = delimiters;
      this.set('uiElements', uiElements);
    },

    /*
     * Uses the constraint tool state which has been specified through
     * the stages of interaction to construct the constraint on the 
     * references and relatives as desired. 
     */
    createConstraint: function() {
      var constrainFromVal = this.get('constrainFromVal');
      var constrainToVal = this.get('constrainToVal');
      var references = this.get('references');
      var relatives = this.get('relatives');
      var expression = this.get('expression');
      var sampler = references[0].getSampler();
      
      var refPropList = Utils.getPropConstraintFromList( references, constrainFromVal.slice(1, constrainToVal.length) );
      var refProp = refPropList[0];
      var relPropList = Utils.getPropConstraintFromList( relatives, constrainToVal.slice(1, constrainToVal.length) ); 

      var relativeF = function() {
        var x = Utils[constrainToVal[0]]( relPropList.map( function( prop ) { return prop.getValue(); }));
        if(sampler){
          var i = sampler.getValue();
          
          console.log('constraint value of i:',i);

        }
        var evaluation = eval( expression );
        refProp.setValue( evaluation );
        return evaluation;  
      };

      refProp.setConstraint(relativeF);
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
      var constrainFromVal = this.get('constrainFromVal');
      for (var i = 0; i < constrainToVal.length; i++) {
        if (constrainToVal[i] in propToConstraintMap) {
          constrainToVal[i] = propToConstraintMap[constrainToVal[i]];
        }
        if (constrainFromVal[i] in propToConstraintMap) {
          constrainFromVal[i] = propToConstraintMap[constrainFromVal[i]];
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
      /*
      switch ( state ) {
        case 'references':
          // TODO: check if selection already exists, set to references if so, OR clear selections when constraint tool selected
          var sm = this.get('sm');
          this.get('sm').delegateMethod('select', 'mouseDown', event);
          var references = this.get('sm').delegateMethod('select', 'getCurrentSelection');
          this.selectReferences( references );
          this.advance();
          break;
        case 'relatives':
          this.get('sm').delegateMethod('select', 'mouseDown', event);
          var relatives = this.get('sm').delegateMethod('select', 'getCurrentSelection');
          this.selectRelatives( relatives );
          this.advance();
          break;
        case 'expression':
          // TODO: check if expression has been submitted?
          break; 
      } */
   

      // TODO: REALLY SHOULD TEST FOR A SELECTION, NOT INSTANCE

      var hitResult = paper.project.hitTest(event.point, mouseHitOptions);
      // TODO: generalize
      if ( hitResult ) { 
        if ( !hitResult.item.data.instance ) { return; }
        var instance = hitResult.item.data.instance;
        this.set('references', [instance]);
      }
    },

    mouseDrag: function(event) {
      if ( !this.get('references') ) { return; }

      var vector = (event.lastPoint.subtract(event.downPoint)).normalize(10);
      var arrowPath = this.get('arrow');
      if ( event.downPoint != event.lastPoint && !arrowPath ) {
        arrowPath = new paper.Group([
          new paper.Path([event.downPoint, event.lastPoint]),
          new paper.Path([
            event.lastPoint.add(vector.rotate(135)),
            event.lastPoint,
            event.lastPoint.add(vector.rotate(-135))
          ])
        ]);
        arrowPath.strokeColor = '#A5FF00';
      } else if ( event.downPoint != event.lastPoint  ) {
        arrowPath.children[0].removeSegment(1);
        arrowPath.children[0].add(event.lastPoint);
        arrowPath.children[1].remove(); // TODO: check for memory leak
        var arrowHead = new paper.Path([
          event.lastPoint.add(vector.rotate(135)),
          event.lastPoint,
          event.lastPoint.add(vector.rotate(-135))
        ]);
        arrowHead.strokeColor = '#A5FF00';
        arrowPath.addChild(arrowHead);
      }
      this.set('arrow', arrowPath);
    },

    dblClick: function(event) {
      
    },

    mouseUp: function(event) {
      //TODO: Really should use selection, rather than instance

      // have to work around arrow itself being hit testable
      var hitResult = paper.project.hitTest(event.point.add(new paper.Point(3, 3)), mouseHitOptions);
      if ( hitResult ) {
        // TODO: generalize to lists?
        if ( !hitResult.item.data.instance ) { return; }
        var instance = hitResult.item.data.instance;
        this.set('relatives', [instance]);

        var arrow = this.get('arrow');
        var uiElements = this.get('uiElements');
        uiElements.arrows.push(arrow);
        this.set('uiElements', uiElements);
        this.set('arrow', null);

        // create ref, rel wheels
        var ref_wheel = PaperUIHelper.createConstraintWheel( this.get('references'), 'ref-wheel' )[0];
        var rel_wheel = PaperUIHelper.createConstraintWheel( this.get('relatives'), 'rel-wheel' )[0];
        PaperUIHelper.addConstraintWheelHandlers( this, ref_wheel, rel_wheel );
      } 
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
      this.set('ref_prop', []);
      this.set('rel_prop', []);
      this.set('mode', 'references');
      this.set('constrainToVal', []);
      this.set('constrainFromVal', []);
      PaperUIHelper.clear(); // TODO: clears everything, want to clear only constraint tool ui
    }, 
 
    

    /*
     *  Constraint Tool UI Elements - Delimiters 
     */

    /*
    createDelimiters: function( instances, property, delimSetName ) {
      switch ( property ) {
        case 'position':
          this.createPositionDelimiters( instances, delimSetName );
          break;
        case 'scale':
          this.createScaleDelimiters( instances, delimSetName );
          break;
        case 'rotation':
          this.createRotationDelimiters( instances, delimSetName );
          break;
        default:
          console.log('[ERROR] Property not recognized for delimiter creation');
          break;
      }
    },

    createPositionDelimiters: function( instances, delimSetName ) {

    },

    createScaleDelimiters: function( instances, delimSetName ) {

    },

    createRotationDelimiters: function( instances, delimSetName ) {

    },

    setDelimiterListeners: function( name, property, listener_set ) {

    },

    setPositionDelimiterListeners: function( delims, listener_set ) {
      
      onMouseOver = function( event ) {
        if ( !delim.active ) {
          delim.setColor
        }
      }

      onMouseClick = function( event ) {
        delim.setColor
        delim.setActive

        constraintTool.setRefProp
        constraintTool.setRefVal
        if ref_prop == rel_prop
          constraintTool.setRelProp
          constraintTool.setRelVal
      }

      onMouseDrag = function( event ) {
        delim.updatePos // if name = x or name = y, do different update
          
      }

      onMouseUp = function( event ) {
        updateExpression
      }
    },

    setScaleDelimiterListeners: function( delims, listener_set ) {
      
      onMouseOver = function( event ) {

      }

      onMouseClick = function( event ) {

      }

      onMouseDrag = function( event ) {

      }
    },

    setRotationDelimiterListeners: function( delims, listener_set ) {
      
      onMouseOver = function( event ) {

      }

      onMouseClick = function( event ) {

      }

      onMouseDrag = function( event ) {

      }
    }
    */
  
  });

  



  return ConstraintToolModel;

});  

    
