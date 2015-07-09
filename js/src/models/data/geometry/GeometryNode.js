/*GeometryNode.js
 * base class for geometry object
 * extends Instance
 */

define([

  'underscore',
  'models/data/Instance',
], function(_, Instance) {


  var GeometryNode = Instance.extend({
    name: 'geometry',
    type: 'geometry',

    defaults: _.extend({}, Instance.prototype.defaults, {}),


    /* initialization
     *
     */
    initialize: function() {
      Instance.prototype.initialize.apply(this, arguments);

    },

  });

  return GeometryNode;

});