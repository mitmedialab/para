/*PathNode.js
* path object
* extends GeometryNode
*/


define([
  'underscore',
  'models/data/GeometryNode',
  'models/PaperManager',

], function(_, GeometryNode, PaperManager) {
  
  var PathNode = GeometryNode.extend({
     defaults: _.extend({},GeometryNode.prototype.defaults, {
           type: 'path',
        }),

    initialize: function(){
      //call the super constructor
      //GeometryNode.prototype.initialize.call(this);
      console.log('initializing path node');
      this.paper = PaperManager.getPaperInstance('path');
      this.path = new this.paper.Path();
      console.log(this.path);
      this.path.nodeParent = this;
      console.log(this.path);
      console.log('path stroke color='+this.get('strokeColor'));
      this.path.strokeColor = this.get('strokeColor');
      this.instances = [];
    },

    addPoint: function(x,y){
      
      this.path.add(new this.paper.Point(x, y));
    },

    draw: function(){
      

    },

    checkIntersections: function(){
      var siblings = this.getSiblings();
      //console.log("checking intersection for :"+siblings.length+" siblings");
      console.log(this.path);
      //console.log(siblings[0].path);
      //currently assumes that siblings have no children- will need to update to a 
      //recursive function to handle checking for intersections in groups...
      for(var i=0;i<siblings.length;i++){
        
        if(siblings[i]!=this){
          //console.log("sibling path at"+i+":");
          console.log(siblings[i].path);
          var intersections = this.path.getIntersections(siblings[i].path);
          //console.log("intersections:");
          console.log(intersections);
          if(intersections.length>0){
            this.trigger('intersect-found');
            this.followPath(siblings[i].path);
            break;
          }

          for (var j = 0; j < intersections.length; j++) {
             var ellipse = new this.paper.Path.Circle({
              center: intersections[j].point,
               radius: 5,
                fillColor: '#009dec'
                });
              ellipse.removeOnMove();
            }
          }

      }


    },

    //creates and stores an instance which is identical to this path, but 
    createInstance: function(){
        var instance = this.path.clone();
        this.instances.push(instance);
        return instance;

    },

    //renders a given instance static and adds it to the scene graph as its own object
    bakeInstance: function(instance){

    },

    followPath: function(path){
      console.log("followPath");
      //console.log(path);
      var num = 10;
      var maxDist = path.length/(num-1);
      var position = path.clone();
      position.flatten(maxDist);
      console.log(position);
      for(var i=0;i<num;i++){
          var instance = this.createInstance();   
          var location = position.segments[i].point;
          instance.position = location.clone();      


      }

      position.remove();


    }



  });

  return PathNode;

});