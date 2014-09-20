/* RootManager.js
* provides a static manager for the root node*/

define([
     'jquery',
  'underscore',
  'backbone',
   'paper'

], function($, _, Backbone, paper){
    var paperInstance;

    var PaperManager = Backbone.Model.extend({
       initialize: function(){

        }
    });

  
// Static method
    PaperManager.getPaperInstance = function (callerId) {
        // "instance" can be "this.instance" (static property) 
        // but it is better if it is private
        if (!paperInstance) {
             var canvas= $('canvas').get(0);
             paperInstance = paper;
             paperInstance.setup(canvas);
             //console.log('setting up paperInstance for'+callerId);
        }
        return paperInstance;
    };

    return PaperManager;

});