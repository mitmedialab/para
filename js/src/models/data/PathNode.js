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
  //drawable paper.js path object that is stored in the pathnode
  var path_literal = null;

  var PathNode = GeometryNode.extend({
    defaults: _.extend({}, GeometryNode.prototype.defaults, {
      type: 'path',
    }),

    


    constructor: function() {

      GeometryNode.apply(this, arguments);
      //console.log('number of nodes='+SceneNode.numNodeInstances);
    },

    //mixin: Utils.nodeMixin,

    initialize: function() {
      //call the super constructor
      GeometryNode.prototype.initialize.call(this);

      //intialize array to store instances
      this.instances = [];
      var instance= this.createInstance();
       this.instances.push(instance);

      var paper = PaperManager.getPaperInstance('path');
       path_literal = new paper.Path();
        path_literal.selected = true;
         path_literal.strokeColor = 'black';
         path_literal.data.nodeParent = this;
         myData.data.instanceParent = null;
    },

    //registers overriding function for update methods- determined by parent node
    extendBehavior: function(from, methodName) {
      //console.log('trying to extend methods');
      // if the method is defined on from ...
      // we add those methods which exists on `from` but not on `to` to the latter
      _.defaults(this, from);
      // … and we do the same for events
      _.defaults(this.events, from.events);
      // console.log(this);
      // console.log(from);

      if (!_.isUndefined(from[methodName])) {
        // console.log('setting methods');
        var old = this[methodName];

        // ... we create a new function on to
        this[methodName] = function() {

          // and then call the method on `from`
          from[methodName].apply(this, arguments);

          // wherein we first call the method which exists on `to`
          var oldReturn = old.apply(this, arguments);

          // and then return the expected result,
          // i.e. what the method on `to` returns
          return oldReturn;

        };
      }

    },

    //creates and stores an instance which is identical to this path 
    createInstance: function(anchor,copy) {
      /*for now it is neccesary to make a copy of the shape data
       * rather than reference it due to the drawing structure of
       * paperjs. update this for efficency in the future
       */
      var instance = new Instance(this);
      //if there are no instances, create a new one with a new path
      //else create an instance with a clone of the first instances' path
      
        if(copy){
          instance.copyParameter(copy);
        }
        
      

      this.listenTo(instance, 'change:mouseUpInstance', this.mouseUpInstance);
      this.listenTo(instance, 'change:anchorInit', this.anchorUpdated);
      if(anchor){
        instance.isAnchor(true);
      }
     

      return instance;

    },

    //creates a specified number of instances, with option to clear existing instances
    createInstances: function(num, clear) {
      if (clear) {
        this.deleteInstances();
      }
      for (var i = 0; i < num; i++) {
        // console.log('creating instance number:'+ i);
       var instance = this.createInstance();
       this.instances.splice(this.instances.length-2,0,instance);
      }
      return this.instances;

    },

    //deletes specified number of instances avoiding start and end if possible
    deleteInstances: function(num, clear) {
      var toRemove = this.instances.length - num;
      if (toRemove >= 1) {
        for (var i = this.instances.length - 1; i >= toRemove; i--) {
          var clearedInstance = this.instances.splice(i,1);
          clearedInstance.clear();
          this.stopListening(clearedInstance);
          clearedInstance = null;
          
        }
      }
      if (clear) {
        this.instances = [];
      }
    },

    //converts an instance into a prototype and adds it to the scene graph as its own object
    bakeInstance: function(instance) {

    },


    //event callbacks

    //updates  overrides GeometryNode update function
    update: function(data) {

        if(data){
            var delta = data.delta;
            var d_instances = data.instances;

            this.path_literal.position.add(delta);

           for(var k=0;k>this.instances.length;k++){
            this.instances[k].clear();
            }

          for(var i=0;i<d_instances.length;i++){
            for(var j=0;j>this.instances.length;j++){
              this.instances[j].update(data[i]);
              this.instances[j].draw(path_literal);
            }
            this.instances.update();
          }
        }

       if (this.children.length > 0) {
          for (var z = 0; z < this.children.length; z++) {
            if (this.children[z] !== null) {
                  this.children[z].update(this.instances);
                  }
              }
          }


    },

    updateInstanceAt: function() {


    },

    //update all instance members if there is more than one
    mouseUpInstance: function(instance) {
      var intersections = this.checkIntersections();
      if (intersections) {
        // console.log("intersection found");
        intersections.node.addChildNode(this);
        intersections.node.update();
      }



      this.update();

      /*for(var i=0;i<this.instances.length;i++){
          if(this.instances[i]!=instance){
            this.instances[i].correspond(instance.data);
          }
        }*/

      /* if (this.instances.length > 1) {
        for (var i = 0; i < this.instances.length; i++) {
          if (this.instances[i].data != path) {
            var clone = path.clone();
            clone.rotate(-path.nodeParent.rotation);
            this.instances[i].update(clone);
          }
        }
      }*/

    },

    getPath: function(index) {
      if (!index) {
        return path_literal;
      } else {
        if (index < this.instances.length) {
          return this.instances[index];
        } else {
          return null;
        }
      }
    },


    //recursively searches for intersections between this nodes' instances and the scenegraph
    recursiveCheckIntersections: function(found_intersections, node) {
      //console.log('starting recurse at node:'+this.name);
      if (node !== null && this.instances.length > 0) {
        for (var i = 0; i < this.instances.length; i++) {
          // console.log('-----checking child at:'+i);
          var intersections = this.instances[i].checkIntersections(node.instances);
          if (intersections) {
            found_intersections = intersections;
            return true;
          } else {

            if (this.children[i].recursiveCheckIntersections(node)) {
              return true;
            }
          }
        }
      }
      return false;
    },

    //checks for intersections between this path and any of its siblings in the scene graph
    checkIntersections: function() {
      //console.log('checking for intersection');
      var siblings = this.getSiblings();

      //currently assumes that siblings have no children- will need to update to a 
      //recursive function to handle checking for intersections in groups...
      for (var i = 0; i < siblings.length; i++) {

        if (siblings[i] != this) {
          for (var j = 0; j < this.instances.length; j++) {
            // console.log('-----checking child at:'+i);
            var intersections = this.instances[j].checkIntersections(siblings[i].instances);
            if (intersections) {
              return {
                node: siblings[i],
                intersections: intersections
              };
            }
          }
        }
      }
      return null;
    },



  });

  return PathNode;

});