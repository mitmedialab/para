/*ContextView.js
 * controls updates to the property menu
 */

define([
  'jquery',
  'underscore',
  'backbone',
  'handlebars'

], function($, _, Backbone, Handlebars) {

var template,source, menuX, menuY, currentNode;
  var ContextView = Backbone.View.extend({
    //
    initialize: function(obj, event_bus) {
      //listen to update view statements from model to re-render view
      //this.listenTo(this.model,'updateView',this.render);

      this.listenTo(event_bus, 'canvasMouseMove', this.setMenuPosition);
      this.listenTo(event_bus, 'openMenu', this.showMenu);
      this.visible = false;
        source = $('#menu-template').html();
      template = Handlebars.compile(source);
      
    },

    events: {
      'mousemove': 'mouseMove',
      'mousedown': 'mouseDown',
      'click #close-btn':'hideMenu',
      'click #new-behavior-btn':'newBehavior'
    },

    setMenuPosition: function(event) {
      menuX = event.pageX;
      menuY = event.pageY;
   
    
    

    },

    showMenu: function(node) {
      currentNode = node;
      var name = node.name;
      var behaviorData = this.generateBehaviors();
  
     
        var html = template({name:name});
        this.$el.html(html);
        this.$el.css({
        visibility: 'visible',
        left: menuX,
        top: menuY,
      });
      this.visible= true;

    },

    newBehavior: function(){
     
      this.model.newBehavior(currentNode);
    },

    generateBehaviors: function(){
      var behaviors = [];
      if(currentNode.behaviors){
        for(var i=0;i<currentNode.behaviors.size();i++){
        }
      }
      return behaviors;

    },

    hideMenu: function() {
      this.$el.css({
        visibility: 'hidden'
      });
      this.visible=false;

    },

    mouseDown: function(event){
     
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