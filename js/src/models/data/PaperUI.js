/* PaperUI.js
 *
 *
 *
 */

define([
  'underscore',
  'backbone',
  'paper',

], function(_, Backbone, paper) {

  var PaperUI = Backbone.Model.extend({
    
    initialize: function(data) {

      Backbone.Model.prototype.initialize.apply(this, arguments);
    } 
  });

  return PaperUI;
});
