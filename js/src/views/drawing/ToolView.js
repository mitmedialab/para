/*ToolView.js
* master view for all drawing tools */

define([
  'jquery',
  'underscore',
  'backbone'

], function($, _, Backbone){

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
    'click #rotateTool': 'rotateToolClick'
  	},

  	 selectToolClick: function(){
  		this.clearActive();
  		$('#selectTool').addClass('active');
  		lastSelected = $('#selectTool');
      this.model.setState('selectTool');

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