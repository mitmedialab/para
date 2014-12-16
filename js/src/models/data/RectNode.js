/*RectNode.js
 * rectangle object
 */


define([
  'underscore',
  'paper',
  'models/data/PolygonNode',
  'models/data/Instance',


], function(_, paper, PolygonNode, Instance) {

     var RectNode = PolygonNode.extend({

    defaults: _.extend({}, PolygonNode.prototype.defaults, {
      name: 'rectangle',
      userParams:null,
    }),

    initialize: function(data) {
      PolygonNode.prototype.initialize.apply(this, arguments);
      this.set('userParams', [{
        label: 'width',
        type: 'text_box',
        val: 0,
        property_name: 'width'
      },
      {
        label: 'height',
        type: 'text_box',
        val: 0,
        property_name: 'height'
      }]);
    },

     normalizePath: function(path, matrix) {
      var userParams = this.get('userParams');
      userParams[0].val = path.bounds.width;
      userParams[1].val = path.bounds.height;
      this.set('userParams',userParams);
      var data =Instance.prototype.normalizePath.apply(this,arguments);  
      return data;
    },

    //called when path points are modified 
    updateParams: function(data) {

    }

  });

  return RectNode;
});