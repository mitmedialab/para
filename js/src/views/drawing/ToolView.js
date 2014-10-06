/*ToolView.js
* master view for all drawing tools */

define([
  'jquery',
  'underscore',
  'backbone',
  'utils/analytics'

], function($, _, Backbone, analytics){

  var lastSelected;
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
        analytics.log('undo','undoClick');
      },

      redoToolClick: function(){
        this.model.redo();
      },

  	 selectToolClick: function(){
  		this.clearActive();
  		$('#selectTool').addClass('active');
  		lastSelected = $('#selectTool');
      this.model.setState('selectTool');

  	},

     followPathToolClick: function(){
      this.clearActive();
      $('#followPathTool').addClass('active');
      lastSelected = $('#followPathTool');
      this.model.setState('followPathTool');

    },

  	penToolClick: function(){
  		this.clearActive();
  		$('#penTool').addClass('active');
  		lastSelected = $('#penTool');
      this.model.setState('penTool');


  	},

  	polyToolClick: function(){
  		this.clearActive();
  		$('#polyTool').addClass('active');
  		lastSelected = $('#polyTool');
      this.model.setState('polyTool');

  	},

    rotateToolClick: function(){
      this.clearActive();
      $('#rotateTool').addClass('active');
      lastSelected = $('#rotateTool');
      this.model.setState('rotateTool');

    },

  	clearActive: function(){
  		if(lastSelected){
  			lastSelected.removeClass('active');
  		}
  	}

  });

  return ToolView;
  
});