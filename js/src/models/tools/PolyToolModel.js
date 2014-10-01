/*PenToolModel.js
*base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PolygonNode',
   'models/PaperManager'

], function(_, Backbone, BaseToolModel, PolygonNode, PaperManager) {
  
  //types for bezier tool behavior
  var types = ['point', 'handleIn', 'handleOut'];
  var nameVal = 0;
  //segment being drawn, mode of current drawing, type
  var sideNum = 6;
  var rotationAmt = 0;
  var scaleAmt = 0;


  var PolyToolModel = BaseToolModel.extend({
  	  defaults:_.extend({},BaseToolModel.prototype.defaults,  {
          }),

   
  	initialize: function(){

  	},

    reset: function(){
    
      if(this.currentPath){
      this.currentPath.selected = false;
        
        var pathNode  = new PolygonNode();
          pathNode.name = "Path_"+nameVal;
            nameVal++;
       this.currentPath.rotate(-rotationAmt);
           //console.log("rad=",this.currentPath.bounds.width/2);
        var instance = pathNode.createInstanceFromPath(this.currentPath.clone());
        instance.rotation.angle = rotationAmt;
        this.trigger('nodeAdded',pathNode);
         this.trigger('rootUpdate');
        this.trigger('rootRender');  
        this.currentPath.remove();
        this.currentPath = null;
      }
      this.trigger('rootRender');

    },


      /*mousedown event- checks to see if current path has been initialized-
      *if it has not, create a new one and trigger a shapeAdded event
      */

      mouseDown : function(event) {
        //console.log("poly mouse down");
          if (!this.currentPath) {
         
          
                       

          var paper = PaperManager.getPaperInstance();
          this.currentPath =  new paper.Path.RegularPolygon(event.point,sideNum,1);
    
         this.currentPath.selected = true;
          this.currentPath.fillColor = this.fillColor;
          this.currentPath.strokeColor = this.strokeColor;
          rotationAmt=0;


        }
      },

      

     //mouse up event
     mouseUp : function(event) {
      this.reset();
      
       },

     //mouse drag event
     mouseDrag: function(event){

       if (this.currentPath) {
        var delta = this.currentPath.position.getDistance(event.point);
        var angle = event.point.subtract(this.currentPath.position).angle;
        var cAngle =this.currentPath.firstSegment.point.subtract(this.currentPath.position).angle; 
       
        var rad = this.currentPath.position.getDistance(this.currentPath.firstSegment.point);
        var scale = delta/rad;
     
        var rotate = angle-cAngle;
       rotationAmt+=rotate;
        //console.log("mouse angle="+angle);
        //console.log("poly angle = "+cAngle);
        //console.log("difference="+rotate);
        this.currentPath.scale(scale);
        this.currentPath.rotate(rotate);
         // this.currentPath.rotate(angle);
       }

     },

     //mouse move event
     mouseMove: function(event){

     }




  });

  return PolyToolModel;

});