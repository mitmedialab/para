/*RectNode.js
 * rectangle object
 */


define([
  'underscore',
  'paper',
  'models/data/PolygonNode',
  'models/data/PathNode',


], function(_, paper, PolygonNode, PathNode) {

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

     normalizeGeometry: function(path, matrix) {
      var userParams = this.get('userParams');
      userParams[0].val = path.bounds.width;
      userParams[1].val = path.bounds.height;
      this.set('userParams',userParams);
      var data =PathNode.prototype.normalizeGeometry.apply(this,arguments);  
      return data;
    },

     //called when path points are modified 
    updateParams: function(data) {
      if(data.property_name=='width'||data.property_name=='height'){
         var userParams = this.get('userParams');
          if(data.property_name ==='width'){
            userParams[0].val = data.value;
          }
          else{
            userParams[1].val = data.value;
          }
          this.set('userParams',userParams);

          var new_master;
          if(this.get('name')==='rectangle'){
            new_master = new paper.Path.Rectangle(new paper.Point(0,0), userParams[0].val, userParams[1].val);
          } 
          else{
           new_master =new paper.Path.Ellipse(new paper.Point(0,0), userParams[0].val, userParams[1].val);
          }
          new_master.visible = false;
          this.set('master_path',new_master.exportJSON());
          new_master.remove();
          console.log('reset path to ',data.value);
      }
    }

  });

  return RectNode;
});