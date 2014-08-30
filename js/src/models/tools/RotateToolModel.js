/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
    'models/PaperManager'


], function(_, Backbone, BaseToolModel, PaperManager) {
  

var paper = PaperManager.getPaperInstance();
  var RotateToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {}),

    initialize: function() {
      this.selectedNodes = [];
      this.angle=0;
      this.startAngle=0;
      
    },

    /*mousedown event
     */
    mouseDown: function(event) {
      this.trigger('getSelection');
      console.log('num of selected shapes ='+this.selectedNodes.length);
      if(this.selectedNodes.length>0){
      var pos = this.selectedNodes[this.selectedNodes.length-1].getFirstSelectedInstance().delta;
    
      var posPoint = new paper.Point(pos.x,pos.y);
      this.angle = event.point.subtract(posPoint).angle;
      this.startAngle = this.selectedNodes[this.selectedNodes.length-1].getFirstSelectedInstance().rotation.angle
      console.log(this.angle);
    }

    },


    dblClick: function(event) {


    },

    //mouse up event
    mouseUp: function(event) {
    
    },

    //mouse drag event
    mouseDrag: function(event) {
        if(this.selectedNodes.length>0){
      var pos = this.selectedNodes[this.selectedNodes.length-1].getFirstSelectedInstance().delta;
      console.log("pos=",pos);
      var posPoint = new paper.Point(pos.x,pos.y);
      var cAngle = event.point.subtract(posPoint).angle;
        console.log("angle="+cAngle);
      var rotate = cAngle-this.angle
      console.log("diff="+rotate);
      this.selectedNodes[this.selectedNodes.length-1].getFirstSelectedInstance().rotation.angle = this.startAngle+rotate;
       this.trigger('rootUpdate');
              this.trigger('rootRender');

    }

    },

    //mouse move event
    mouseMove: function(event) {

    }



  });

  return RotateToolModel;

});