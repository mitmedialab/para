/*ToolView.js
* master view for all drawing tools */

define([
  'jquery',
  'underscore',
  'backbone',
  'utils/analytics'

], function($, _, Backbone, analytics){

  var lastSelected;
  var eventType = 'toolChange';
  var ToolView = Backbone.View.extend({
    //

    initialize: function(){
      this.penToolClick();
    },

    render: function(){
 
    },

     events: {
    'click #selectTool': 'selectToolClick',
    'click #penTool': 'penToolClick',
    'click #polyTool': 'polyToolClick',
    'click #rotateTool': 'rotateToolClick',
    'click #followPathTool': 'followPathToolClick',
    'click #undoTool': 'undoToolClick',
    'click #redoTool': 'redoToolClick'

  	},

      undoToolClick: function(){
        this.model.undo();
        analytics.log(eventType,{type:eventType,id:'undo',action:'undo'});
      },

      redoToolClick: function(){
        this.model.redo();
        analytics.log(eventType,{type:eventType,id:'redo',action:'redo'});

      },

  	 selectToolClick: function(){
  		this.clearActive();
  		$('#selectTool').addClass('active');
  		lastSelected = $('#selectTool');
      this.model.setState('selectTool');
      analytics.log(eventType,{type:eventType,id:'selectTool',action:'toolSelected'});


  	},

     followPathToolClick: function(){
      this.clearActive();
      $('#followPathTool').addClass('active');
      lastSelected = $('#followPathTool');
      this.model.setState('followPathTool');
      analytics.log(eventType,{type:eventType,id:'followPathTool',action:'toolSelected'});


    },

  	penToolClick: function(){
  		this.clearActive();
  		$('#penTool').addClass('active');
  		lastSelected = $('#penTool');
      this.model.setState('penTool');
      analytics.log(eventType,{type:eventType,id:'penTool',action:'toolSelected'});


  	},

  	polyToolClick: function(){
  		this.clearActive();
  		$('#polyTool').addClass('active');
  		lastSelected = $('#polyTool');
      this.model.setState('polyTool');
      analytics.log(eventType,{type:eventType,id:'polyTool',action:'toolSelected'});


  	},

    rotateToolClick: function(){
      this.clearActive();
      $('#rotateTool').addClass('active');
      lastSelected = $('#rotateTool');
      this.model.setState('rotateTool');
      analytics.log(eventType,{type:eventType,id:'rotateTool',action:'toolSelected'});


    },

  	clearActive: function(){
  		if(lastSelected){
  			lastSelected.removeClass('active');
  		}
  	}

  });

  return ToolView;
  
});