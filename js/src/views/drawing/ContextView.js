/*ContextView.js
 * controls updates to the property menu
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars'

], function($, _, Backbone, Handlebars) {


  var ContextView = Backbone.View.extend({
    //
    initialize: function(obj, event_bus) {
      //listen to update view statements from model to re-render view
      //this.listenTo(this.model,'updateView',this.render);

      this.listenTo(event_bus, 'canvasMouseMove', this.setMenuPosition);
      this.listenTo(event_bus, 'shiftClick', this.showMenu);
      this.visible = false;
    },

    events: {
      'mousemove': 'mouseMove',
      'mousedown': 'mouseDown'
    },

    render: function() {
      // console.log('property view rendering');
      // console.log('source='+$('#property-list-template').html());
      var source = $('#property-list-template').html();
      var template = Handlebars.compile(source);
      var properties = this.model.getSelected();
      // console.log(properties);
      var html = template(properties);
      this.$el.html(html);

    },
    setMenuPosition: function(event) {
      if(!this.visible){
      this.$el.css({
        left: event.pageX,
        top: event.pageY
      });
    }

    },

    showMenu: function() {
      this.$el.css({
        visibility: 'visible'
      });
      this.visible= true;

    },

    hideMenu: function() {
      this.$el.css({
        visibility: 'hidden'
      });
      this.visible=false;

    },

    mouseDown: function(event){
      this.hideMenu();
    },

    nameChange: function() {
      //console.log("updating name to:"+ $('#obj-name').val());
      this.model.updateSelected({
        name: $('#obj-name').val()
      });
    }

  });

  return ContextView;

});