/* ContextView.js
 * controls updates to the property menu
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars'

], function($, _, Backbone, Handlebars) {

var template,source, model, view, menuX, menuY, currentNode;
  var constraintPropMap = {};
    constraintPropMap['stroke-outer'] = 'stroke'; // TODO: should be made into one item
    constraintPropMap['stroke-inner'] = 'stroke'; // TODO: should be combined with previous
    constraintPropMap['weight'] = 'weight';
    constraintPropMap['fill'] = 'fill';
    constraintPropMap['scale']  = 'scale';
    constraintPropMap['position'] = 'position';
    constraintPropMap['orient1'] = 'orientation'; // TODO: should be made into one item
    constraintPropMap['orient2'] = 'orientation'; // TODO: should be combined with previous
 
  var constraintTypeMap = {};
    constraintTypeMap['less'] = 'less';
    constraintTypeMap['more'] = 'more';
    constraintTypeMap['equal'] = 'equal'; 
  var ContextView = Backbone.View.extend({
    //
    initialize: function(obj) {
      //listen to update view statements from model to re-render view
      // this.event_bus = event_bus;
      // this.listenTo(this.event_bus, 'openExpressionEditor', this.showEditor);
      // this.listenTo(this.event_bus, 'openConstraintWheel', this.showWheel);
      this.listenTo(this.model, 'change:mode', this.render);
      this.listenTo(this.model, 'change:delimited', this.displayDelimiters);
      this.wheelVisible = false;
      this.editorVisible = false;
      source = $('#context-menu').html();
      model = this.model;
      view = this;

      // Super hacky way of letting this view listen to expression changes from the sidebar
      // TODO: fix this hack, either make the expression editor part of another view and do event passing
      // or somehow make the expression editor part of this view
      $('#relationIndicator').on('click', this.showRelationSelector);
      $('#relationSelector').on('click', this.relationSelect);
      $('#expression').on('change', this.constraintExpressionChange);
    },

    events: {
      'click #constraint-wheel.active': 'constraintPropertyClick',
      'click #expType.active': 'constraintTypeClick',
      'change #expression.active': 'constraintExpressionChange'
    },

    render: function() {
      switch (this.model.get('mode')) {
        case 'references':
          this.hideWheel();
          this.hideExpEditor();
          break;
        case 'property':
          this.showWheel();
          break;
        case 'relatives':
          this.unfocusWheel();
          break;
        case 'expression':
          this.showExpEditor();
          break;
      }
    },

    /*
     * Draw the delimiting shapes onto the screen. 
     * NOTE: This requires access to the canvas paper object. Ideally, this view will have direct access to
     * a passed reference of this paper object. However, as of now the hacked solution is to delegate the 
     * drawing responsibility to models which have access to the paper object.
     */
    displayDelimiters: function() {
      switch (this.model.get('property')) {
        case 'position':
          break;
        case 'scale':
          break;
        case 'orientation':
          break;
        case 'strokeWeight':
          break;
        case 'stroke':
          break;
        case 'fill':
          break;
      }
    },

    showRelationSelector: function(event) {
      var indicator = $('#relationIndicator');
      if (indicator.hasClass('active')) {
        view.hideRelationSelector();
        return;
      }

      $('#relationIndicator').addClass('active');
      $('#relationSelector').css({
        visibility: 'visible'
      });
    },

    relationSelect: function(event) {
      // TODO: could use a map for compactness
      function getIconPosForRelation(relationName) {
        switch (relationName) {
          case 'less':
            return '-557px';
            break;
          case 'more':
            return '-593px';
            break;
          case 'equal':
            return '-629px';
            break;
        }
      }


      // TODO: get exact element, send to model
      $('#relationSelector').find('*').removeClass('active');
      var element = $(event.target);
      var elementId = element.attr('id');
      element.addClass('active');
      model.setConstraintType(constraintTypeMap[elementId]);
      $('#relationIndicator').css('background-position-y', getIconPosForRelation(elementId));
      view.hideRelationSelector(); // TODO: Ideally, should get a positive return from the previous instruction
    },

    hideRelationSelector: function() {
      $('#relationIndicator').removeClass('active');
      $('#relationSelector').css({
        visibility: 'hidden'
      });
    },

    showWheel: function() {
      // get position for handle from initial reference
      var ref_instance = this.model.get('references')[0];
      var ref_position = ref_instance.get('screen_position');
      var ref_width = ref_instance.get('screen_width');
      var ref_height = ref_instance.get('screen_height');

      this.$el.css({
        left: ref_position.x,
        top: ref_position.y,
        width: ref_width,
        height: ref_height
      });
      this.$('#constraint-wheel-box').css({
        visibility: 'visible'
      });
      this.$('#constraint-wheel').attr('class', 'active');
      this.wheelVisible = true;
    },

    unfocusWheel: function() {
      this.$('#constraint-wheel').attr('class', '');
    },

    hideWheel: function() {
      this.$('#constraint-wheel').attr('class', '');
      this.$('#constraint-wheel-box').css({
        visibility: 'hidden'
      });
      this.wheelVisible = false;
    },

    showExpEditor: function() {
      $('#expInput').css({
        display: 'inherit'
      });
      this.editorVisible = true;
    },

    hideExpEditor: function() {
      this.$('#expInput').css({
        display: 'none'
      });
      this.editorVisible = false;
    },

    constraintPropertyClick: function(event) {
      var element = $(event.target);
      var elementId = element.attr('id');
      console.log('Registered click from: ' + elementId);
      this.model.setConstraintProperty(constraintPropMap[elementId]);
    },

    constraintTypeClick: function(event) {
      $('#expType').find('*').removeClass('active');
      var element = $(event.target);
      var elementId = element.attr('id');
      element.addClass('active');
      console.log('Registered click from: ' + elementId);
      this.model.setConstraintType(constraintTypeMap[elementId]);
    },

    constraintExpressionChange: function(event) {
      var element = $(event.target);
      var elementText = element.val();
      console.log('Registered expression input change: ' + elementText);
      model.setConstraintExpression(elementText);
    },

  });

  return ContextView;

});
