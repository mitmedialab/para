/*PointNode.js
 * point object
 * extends InstanceNode
 * node that stores point data
 */


define([
  'underscore',
  'models/data/Instance',
  'utils/TrigFunc',
  'utils/PPoint',
  'paper'

], function(_, Instance,TrigFunc, PPoint, paper) {
  //drawable paper.js path object that is stored in the pathnode
  var PointNode = Instance.extend({
   
    defaults: _.extend({}, Instance.prototype.defaults, {
     
       name: 'point',
      type: 'geometry',
    }),


    initialize: function(data) {
      Instance.prototype.initialize.apply(this, arguments);
      var handleIn = new PPoint(0,0,0);
      handleIn.setNull(true);
      var handleOut = new PPoint(0,0,0);
      handleOut.setNull(true);
      this.set('handle_in', handleIn);
      this.set('handle_out', handleOut);
    },

    normalizeGeometry: function(segment) {
      var data = {};
      data.position = new PPoint(segment.point.x,segment.point.y);
      data.handle_in = new PPoint(segment.handleIn.x,segment.handleIn.y);
      data.handle_out = new PPoint(segment.handleOut.x,segment.handleOut.y);
      this.set(data);
      return data;
    },

    render: function(){
      return 'point';
    }


  });

  return PointNode;

});