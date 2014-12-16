/*EllipseNode.js
 * ellipse object
 */


define([
  'underscore',
  'paper',
  'models/data/RectNode',


], function(_, paper, RectNode) {

     var EllipseNode = RectNode.extend({

    defaults: _.extend({}, RectNode.prototype.defaults, {
      name: 'ellipse'
    }),

    initialize: function(data) {
      RectNode.prototype.initialize.apply(this, arguments);
    },

    //called when path points are modified 
    updateParams: function(data) {

    }

  });

  return EllipseNode;
});