/*Condition.js
 * base class for condition datatype
 */

define([
    'underscore',
    'backbone'
  ],

  function(_, Backbone) {
    var Condition = Backbone.Model.extend({

      constructor: function() {
        this.val = 0;
        this.range = 10;
      },

      getState: function() {
        while (this.val < this.range) {
          this.val++;
          return true;
        }
        return false;

      }

    });

    return Condition;
  });