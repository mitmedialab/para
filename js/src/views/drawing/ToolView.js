/*ToolView.js
 * master view for all drawing tools */

define([
  'jquery',
  'underscore',
  'backbone',
  'utils/analytics'

], function($, _, Backbone, analytics) {

  var lastSelected;
  var eventType = 'toolChange';
  var ToolView = Backbone.View.extend({
    //

    initialize: function() {
      this.polyToolClick();
    },

    render: function() {

    },

    events: {
      'click #selectTool': 'selectToolClick',
      'click #dselectTool': 'dSelectToolClick',
      'click #penTool': 'penToolClick',
      'click #polyTool': 'polyToolClick',
      'click #rectangleTool': 'rectToolClick',
      'click #ellipseTool': 'ellipseToolClick',
      'click #rotateTool': 'rotateToolClick',
      'click #scaleTool': 'scaleToolClick',

      'click #followPathTool': 'followPathToolClick',
      'click #undoTool': 'undoToolClick',
      'click #redoTool': 'redoToolClick'

    },

    undoToolClick: function() {
      this.model.undo();
      analytics.log(eventType, {
        type: eventType,
        id: 'undo',
        action: 'undo'
      });
    },

    redoToolClick: function() {
      this.model.redo();
      analytics.log(eventType, {
        type: eventType,
        id: 'redo',
        action: 'redo'
      });

    },

    selectToolClick: function() {
      this.clearActive();
      $('#selectTool').addClass('active');
      lastSelected = $('#selectTool');
      this.model.setState('selectTool', 'select');
      analytics.log(eventType, {
        type: eventType,
        id: 'selectTool',
        action: 'toolSelected'
      });


    },

    dSelectToolClick: function() {
      this.clearActive();
      $('#dselectTool').addClass('active');
      lastSelected = $('#dselectTool');
      this.model.setState('selectTool', 'dselect');
      analytics.log(eventType, {
        type: eventType,
        id: 'dselectTool',
        action: 'toolSelected'
      });
    },

    followPathToolClick: function() {
      this.clearActive();
      $('#followPathTool').addClass('active');
      lastSelected = $('#followPathTool');
      this.model.setState('followPathTool');
      analytics.log(eventType, {
        type: eventType,
        id: 'followPathTool',
        action: 'toolSelected'
      });
    },

    penToolClick: function() {
      this.clearActive();
      $('#penTool').addClass('active');
      lastSelected = $('#penTool');
      this.model.setState('penTool');
      analytics.log(eventType, {
        type: eventType,
        id: 'penTool',
        action: 'toolSelected'
      });


    },

    rectToolClick: function() {
      this.clearActive();
      $('#rectangleTool').addClass('active');
      lastSelected = $('#rectangleTool');
      this.model.setState('polyTool', 'rect');
      analytics.log(eventType, {
        type: eventType,
        id: 'rectangleTool',
        action: 'toolSelected'
      });


    },

    ellipseToolClick: function() {
      this.clearActive();
      $('#ellipseTool').addClass('active');
      lastSelected = $('#ellipseTool');
      this.model.setState('polyTool', 'ellipse');
      analytics.log(eventType, {
        type: eventType,
        id: 'ellipseTool',
        action: 'toolSelected'
      });


    },

    polyToolClick: function() {
      this.clearActive();
      $('#polyTool').addClass('active');
      lastSelected = $('#polyTool');
      this.model.setState('polyTool', 'poly');
      analytics.log(eventType, {
        type: eventType,
        id: 'polyTool',
        action: 'toolSelected'
      });
    },

    rotateToolClick: function() {
      this.clearActive();
      $('#rotateTool').addClass('active');
      lastSelected = $('#rotateTool');
      this.model.setState('selectTool', 'rotate');
      this.model.selectTool.
      analytics.log(eventType, {
        type: eventType,
        id: 'rotateTool',
        action: 'toolSelected'
      });
    },

    scaleToolClick: function() {
      this.clearActive();
      $('#scaleTool').addClass('active');
      lastSelected = $('#scaleTool');
      this.model.setState('selectTool', 'scale');
      this.model.selectTool.
      analytics.log(eventType, {
        type: eventType,
        id: 'scaleTool',
        action: 'toolSelected'
      });
    },

    clearActive: function() {
      if (lastSelected) {
        lastSelected.removeClass('active');
      }
    }

  });

  return ToolView;

});