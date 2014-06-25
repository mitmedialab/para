/*PathNode.js
* path object
* extends GeometryNode
*/


define([
  'underscore',
  'models/data/GeometryNode',
  'models/PaperManager',
  'models/data/Instance'

], function(_, GeometryNode, PaperManager, Instance) {
  
  var PathNode = GeometryNode.extend({
     defaults: _.extend({},GeometryNode.prototype.defaults, {
           type: 'path',
        }),

    initialize: function(){
      //call the super constructor
      GeometryNode.prototype.initialize.call(this);
      console.log("path visible"+this.visible);  
      //create a paperjs path object and set its parent to this
      this.paper = PaperManager.getPaperInstance('path');
      this.path = new this.paper.Path();
      this.path.nodeParent = this;
      this.path.strokeColor = this.get('strokeColor');

      //bind an update event to the path
      this.path.on('mouseup',function(){
        this.nodeParent.updateInstances(this);
        this.nodeParent.update();
        });
      //intialize array to store instances
      this.instances = [];
    },

    //update all instance members
    updateInstances: function(path){
          console.log('update event called on path');
        
          for (var i = 0; i < this.instances.length; i++) {
            if(this.instances[i].data!=path){
              var clone = path.clone();
              clone.rotate(-path.nodeParent.rotation);
              this.instances[i].update(clone);
            }
          }

        },


    update: function(){
      console.log("number of children="+this.getNumChildren());
      if(this.getParentNode() instanceof PathNode){
        console.log("updating follow path");
        this.followPath(this.parent, this.instances);
      }

      if(this.children.length>0){
                for(var i=0; i<this.children.length;i++){
                    if(this.children[i]!==null){
                        this.children[i].update();
                    }
                }
            }

            this.trigger('change:update');

    },

     remove: function(){
       this.path.remove();
      this.visible = false;

    },

    //checks for intersections between this path and any of its siblings in the scene graph
    checkIntersections: function(){
      var siblings = this.getSiblings();
  
      //currently assumes that siblings have no children- will need to update to a 
      //recursive function to handle checking for intersections in groups...
      for(var i=0;i<siblings.length;i++){
        
        if(siblings[i]!=this){  
          var intersections;
          /*if(siblings[i].instances.length>0){
            intersections = this.path.getIntersections(siblings[i].path);

          }
          else{*/
            intersections = this.path.getIntersections(siblings[i].path);
          //}
          if(intersections.length>0){
            this.trigger('intersect-found');
            this.createInstances(10);
            this.followPath(siblings[i], this.instances);
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

    //creates and stores an instance which is identical to this path 
    createInstance: function(){
      /*for now it is neccesary to make a copy of the shape data
      * rather than reference it due to the drawing structure of
      * paperjs. update this for efficency in the future
      */
        var instance = new Instance(this.path.clone());
        this.listenTo(instance,'change:updateInstances',this.updateInstances);
        this.instances.push(instance);
        
        return instance;

    },

    //creates a specified number of instances, with option to clear existing instances
    createInstances: function(num, clear){
        if(clear){
          this.deleteInstances();
        }
        for(var i=0;i<num;i++){
          this.createInstance(); 
        }
        return this.instances;

    },

    deleteInstances: function(){
       for(var i=0;i<this.instances.length;i++){  
          this.instances[i].clear();
          this.instances[i] = null;
        }
        this.instances = [];
    },

    //renders a given instance static and adds it to the scene graph as its own object
    bakeInstance: function(instance){ 

    },

//projects a set of instances along a parent path
    followPath: function(parent, instances){
      this.path.strokeColor='red';
      var path = parent.path;
      var num =instances.length;
      var maxDist = path.length/(num-1);
      var position = path.clone();
      position.flatten(maxDist);
      //console.log(position);
      var location;
      for(var i=0;i<instances.length;i++){  
         //console.log(location);
         var location_n = position.segments[i].point;
        var instance = instances[i];
        instance.resetRotation();
         if(location){  
          
          var delta = location_n.subtract(location);
          delta.angle+=90;

          instance.data.rotate(delta.angle,instance.data.position); 
          instance.rotation=delta.angle;
        }
       
        instance.data.position = location_n;
       
          
        
        location = location_n;  


      }
     if(this.visible){
       this.remove();
     }
      if(this.getParentNode!=parent){
        parent.addChildNode(this);
      }
      position.remove();


    }



  });

   

  return PathNode;

});