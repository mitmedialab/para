/* PaperManager.js
* provides other classes with access to a static paper.js object*/

define([
     'jquery',
  'underscore',
  'backbone',
   'paper'

], function($, _, Backbone, paper){
    var paperInstance;
    var subPaperInstance;

    var PaperManager = Backbone.Model.extend({
       initialize: function(){

        }
    });

  
// Static method
    PaperManager.getPaperInstance = function (type) {
        // "instance" can be "this.instance" (static property) 
        // but it is better if it is private
       if(type==='sub-canvas'){
               if (!subPaperInstance) {
             var subcanvas= $('canvas').get(1);
            console.log('canvas=',subcanvas);

             subPaperInstance = new paper.PaperScope();
             //paper.install($('canvas', window.parent.document));
             subPaperInstance.setup(subcanvas); 
             //console.log('setting up paperInstance for'+callerId);

        }
        return subPaperInstance;
        }

        if (!paperInstance) {
             var canvas= $('canvas').get(0);
             console.log('canvas=',canvas);
             paperInstance = new paper.PaperScope();
             paperInstance.setup(canvas); 
             //console.log('setting up paperInstance for'+callerId);
        }
        return paperInstance;
    };

    return PaperManager;

});