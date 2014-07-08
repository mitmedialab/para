/*PathNode.js
 * path object
 * extends GeometryNode
 * node with actual path in it
 */


define([
  'underscore',
  'models/data/GeometryNode',
  'models/PaperManager',
  'models/data/Instance'

], function(_, GeometryNode, PaperManager, Instance) {
  //drawable paper.js path object that is stored in the pathnode

  var PathNode = GeometryNode.extend({
    defaults: _.extend({}, GeometryNode.prototype.defaults, {
      type: 'path',
    }),

    path_literal: null,

    


    constructor: function() {

      GeometryNode.apply(this, arguments);
      //console.log('number of nodes='+SceneNode.numNodeInstances);
    },

    //mixin: Utils.nodeMixin,

    initialize: function() {
     console.log("path is intialized");
     GeometryNode.prototype.initialize.call(this);

      //intialize array to store instances

        var paper = PaperManager.getPaperInstance('path');
        this.path_literal = new paper.Path();
       this.path_literal.selected = true;
         this.path_literal.strokeColor = 'black';
         this.path_literal.data.nodeParent = this;
         this.path_literal.data.instanceParent = null;
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
  

    //event callbacks

    //updates  overrides GeometryNode update function
    update: function(data) {

        if(data){
            var delta = data.delta;
            var d_instances = data.instances;
           this.path_literal.position=this.path_literal.position.add(delta);
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
      this.trigger('change:mouseUpInstance', this);
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
        return this.path_literal;
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