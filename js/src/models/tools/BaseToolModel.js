/*BaseToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone'

], function(_, Backbone) {
  

  var BaseToolModel = Backbone.Model.extend({
 	defaults: {
  	},
  currentPath: null,
  currentNode: null,

  	constructor: function(){
  		Backbone.Model.apply(this, arguments);
  	},

  	reset: function(){
  
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

     //key down event
     keyDown: function(event){

     }


  });

  return BaseToolModel;

});