/* ContextView.js
 * controls updates to the property menu
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars'

], function($, _, Backbone, Handlebars) {

var template,source, menuX, menuY, currentNode;
  var constraintPropMap = {};
    constraintPropMap['stroke-outer'] = 'stroke'; // TODO: should be made into one item
    constraintPropMap['stroke-inner'] = 'stroke'; // TODO: should be combined with previous
    constraintPropMap['weight'] = 'weight';
    constraintPropMap['fill'] = 'fill';
    constraintPropMap['scale']  = 'scale';
    constraintPropMap['position'] = 'position';
    constraintPropMap['orient1'] = 'orientation'; // TODO: should be made into one item
    constraintPropMap['orient2'] = 'orientation'; // TODO: should be combined with previous
  
  var ContextView = Backbone.View.extend({
    //
    initialize: function(obj) {
      //listen to update view statements from model to re-render view
      // this.event_bus = event_bus;
      // this.listenTo(this.event_bus, 'openExpressionEditor', this.showEditor);
      // this.listenTo(this.event_bus, 'openConstraintWheel', this.showWheel);
      this.listenTo(this.model, 'change:mode', this.render);
      this.wheelVisible = false;
      this.editorVisible = false;
      source = $('#context-menu').html();
    },

    events: {
      'click #constraint-wheel.active': 'constraintPropertyClick',
      'click #constraint-type.active': 'constraintTypeClick',
      'change #constraint-exp.active': 'constraintExpressionClick'
    },

    render: function() {
      switch (this.model.get('mode')) {
        case 'property':
          this.showWheel();
          break;
        case 'relatives':
          this.unfocusWheel();
          break;
        case 'type':
          this.showExpEditor();
          break;
      }
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
      this.$('#constraint-wheel').css({
        visibility: 'hidden'
      });
      this.wheelVisible = false;
    },

    showExpEditor: function() {
      this.$('#expInput').css({
        visibility: 'visible'
      });
    },

    hideExpEditor: function() {
      this.$('#exp-editor').css({
        visibility: 'hidden'
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
      var element = $(event.target);
      var elementId = element.attr('id');
      console.log('Registered click from: ' + elementId);
      this.model.setConstraintType(constraintTypeMap[elementId]);
    },

    constraintExpressionClick: function(event) {
      var element = $(event.target);
      var elementText = element.val();
      console.log('Registered expression input change: ' + elementText);
      this.model.setConstraintExpression(elementText);
      // this.model.passEvent(tool, 'setConstraintExpression');
    },

  });

  return ContextView;

});
