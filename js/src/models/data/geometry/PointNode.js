/*PointNode.js
 * point object
 * extends InstanceNode
 * node that stores point data
 */


define([
  'underscore',
  'models/data/geometry/GeometryNode',
  'utils/TrigFunc',
  'models/data/properties/PPoint',
  'paper'

], function(_,GeometryNode,TrigFunc, PPoint, paper) {
  //drawable paper.js path object that is stored in the pathnode
  var PointNode =GeometryNode.extend({
   
    defaults: _.extend({}, GeometryNode.prototype.defaults, {
     
      name: 'point',
      type: 'geometry',
      index: -1,
      selected: false,
      selection_type: 'none'
    }),


    initialize: function() {
     GeometryNode.prototype.initialize.apply(this, arguments);
      var handleIn = new PPoint(0,0,0);
      handleIn.setNull(true);
      var handleOut = new PPoint(0,0,0);
      handleOut.setNull(true);
      this.set('handle_in', handleIn);
      this.set('handle_out', handleOut);
    },

    changeGeomInheritance: function(segment) {
      var data = {};
      data.position = new PPoint(segment.point.x,segment.point.y);
      data.handle_in = new PPoint(segment.handleIn.x,segment.handleIn.y);
      data.handle_out = new PPoint(segment.handleOut.x,segment.handleOut.y);
      data.index = segment.index;
      this.set(data);
    },

    deleteSelf: function(){
      
    },

    render: function(){
      return 'point';
    },

    compile: function(){

    }


  });

  return PointNode;

});