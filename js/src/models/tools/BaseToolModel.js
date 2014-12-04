/*BaseToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'paper',
  'backbone',


], function(_, paper, Backbone) {


  var BaseToolModel = Backbone.Model.extend({

    defaults: {
      fill_color: '#ffffff',
      stroke_color: '#000000',
      stroke_width: 1,
      currentPaperObjects: null, //stores literal paperjs objects created / selected by tool
      matrix: null,

    },


    initialize: function() {
      this.set('literals', []);
      this.set('matrix', new paper.Matrix());

    },

    reset: function() {

    }


  });


  return BaseToolModel;

});