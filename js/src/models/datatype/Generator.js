/*Generator.js
 * base class for generator datatype
 */

define([
	'underscore',
	'backbone'
  ],

  function(_,Backbone) {
    var Generator = Backbone.Model.extend({
      
      constructor: function(action, condition) {
      	this.condition = condition;
      	//console.log(action);
      	this.action = action; 
      	this.action.format(condition.range);
      },

      tick: function(){
      	 while(this.condition.getState()){
      	 	return this.action.next(this.condition.val);
      	 }
      	 throw { value: undefined, done: true }
      }

    });

    return Generator;
  });
