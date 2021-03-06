/*BaseToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'paper',
  'backbone',


], function(_, paper, Backbone) {


  var BaseToolModel = Backbone.Model.extend({

    defaults: {

      currentPaperObjects: null, //stores literal paperjs objects created / selected by tool
      matrix: null,
      fillColor: {a:1,r:1,g:1,b:1,h:0,s:0 ,l:1,noColor:false},
      strokeColor: {a:1,r:0,g:0,b:0,h:0,s:0 ,l:0,noColor:false},
      strokeWidth: 1,
      'tool-mode': 'standard',
      'tool-modifier': 'none',

    },


    initialize: function() {

      this.set('matrix', new paper.Matrix());

    },

    reset: function() {

    },

     modeChanged: function(mode,modifier) {
      this.set('tool-mode',mode);
      this.set('tool-modifier',modifier);
    },


  });


  return BaseToolModel;

});