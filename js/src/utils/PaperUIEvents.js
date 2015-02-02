/* PaperUIEvents.js
 *
 * A namespace which holds different event listeners useful in Para interactions to place on PaperUI elements.
 *
 */

define([
  'jquery',
  'underscore',
  'paper',
  'backbone',
  'utils/PPoint'
], function($, _, paper, backbone, PPoint) {

  var PaperUIEvents = {

    addEventListener: function( path, eventName, response ) {
      path[eventName] = response;
    },

    createDelimiterMouseoverListener: function( constraintTool ) {
      var listener = function( event ) {
        var path = event.target;
        path.strokeWidth = 1.3 * path.strokeWidth;
        path.strokeColor = "red";
      };
      return listener;
    },

    createDelimiterSelectListener: function( constraintTool ) {
      var listener = function( event ) {
        var path = event.target;
        var path_id = path.id;
        var prop_chain = path_id.split("-");
        constraintTool.set('constraintToVal', prop_chain);
      };
      return listener;
    }
  };

  return PaperUIEvents;
});
