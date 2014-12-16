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
      style: {
        fill_color: '#ffffff',
        stroke_color: '#000000',
        stroke_width: 1
      }

    },


    initialize: function() {

      this.set('matrix', new paper.Matrix());

    },

    reset: function() {

    }


  });


  return BaseToolModel;

});