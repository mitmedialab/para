/* PaperUI.js
 *
 *
 *
 */

define([
  'underscore',
  'paper',
  'models/data/PathNode',

], function(_, paper, PathNode) {

  var PaperUI = PathNode.extend({
    
    defaults: _.extend({}, PathNode.prototype.defaults, {
      name: 'ui',
    }),

    // TODO: perhaps allow this to take path data and normalize it?
    initialize: function(data) {
      PathNode.prototype.initialize.apply(this, arguments);
    },
   
  });

  return PaperUI;
});
