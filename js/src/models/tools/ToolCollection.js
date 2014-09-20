/*ToolCollection.js
* a collection that contains all of the tool models
*/

define([
  'jquery',
  'underscore',
  'backbone',
  'models/tools/BaseToolModel'

], function($, _, Backbone, BaseToolModel){


  var ToolCollection = Backbone.Collection.extend({
    model:BaseToolModel,
   
    defaults:{

    },

    initialize: function(){

  },

   events: {
        
    },

  });

  return ToolCollection;
  
});