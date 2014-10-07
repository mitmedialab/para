/*BaseToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone'

], function(_, Backbone) {
  

  var BaseToolModel = Backbone.Model.extend({ 
  style:{ fillColor: '#ffffff',
    strokeColor: '#00000',
    strokeWidth: 1,},
 	defaults: {
  	},
  currentPath: null,
  currentNode: null,
 

  	constructor: function(){
  		Backbone.Model.apply(this, arguments);
     
  	},

  	reset: function(){
      this.trigger('rootRender');
  	},

  	//mousedown event
	mouseDown : function(event) {
  		
       },
     //mouse up event
     mouseUp : function(event) {
  		
       },

     //mouse drag event
     mouseDrag: function(event){

     },

     //mouse move event
     mouseMove: function(event){

     },

     dblClick: function(event) {
    
    },

     //key down event
     keyDown: function(event){

     }


  });
  

  return BaseToolModel;

});