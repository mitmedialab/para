/*ShapeToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel'

], function(_, Backbone, BaseToolModel) {
  
  var ShapeToolModel = BaseToolModel.extend({
  	type: "default",

  	initialize: function(obj){
  		this.type = obj.type;
  		console.log(this.type);
  	},



  });

  return ShapeToolModel;

});