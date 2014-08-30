/*Action.js
 * base class for action datatype
 */

define([
	'underscore',
	'backbone'
  ],

  function(_,Backbone) {
    var Action = Backbone.Model.extend({
      
      constructor: function() {
      },

      format: function(range){

      },

      next: function(val){
      	return val*10;
      }

    });

    return Action;
  });
