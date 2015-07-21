/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'paper',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',

], function(_, paper, Backbone, BaseToolModel, PathNode) {
  var segment, instanceIndex, handle;


  var hitOptions = {
    segments: true,
    stroke: true,
    handles: true,
    fill: true,
    tolerance: 2
  };

  var FollowPathToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {}),

    initialize: function() {
      this.selectedNodes = [];
      this.currentPaths = [];
      this.segmentMod = false;
    },

    /*mousedown event
     */
    mouseDown: function(event) {

      if (!event.modifiers.shift) {
        if (this.currentNode) {
          this.currentNode.deselectAll();
        }
        this.currentPaths = [];
        this.currentNode = null;
        segment = null;
        handle = null;
        this.selectedNodes = [];
        this.trigger('selectionReset');
      }



      var hitResult = paper.project.hitTest(event.point, hitOptions);

      //deselect everything
      var children = paper.project.activeLayer.children;
      for (var i = 0; i < children.length; i++) {
        children[i].selected = false;
      }

      if (hitResult) {

        var path = hitResult.item;
        instanceIndex = path.instanceIndex;


        //this sets currentNode depending on current selection level in tree
        this.trigger('nodeSelected', path);

        //checks to make sure path is within current node
        if (this.selectedNodes.length > 0) {
          if (this.currentNode.containsPath(path)) {
            if (this.currentPaths.indexOf(path) == -1) {
              this.currentPaths.push(path);
            }
            this.trigger('setSelection', path);

            if (event.modifiers.option) {
              this.trigger('optionClick', this.selectedNodes[this.selectedNodes.length - 1]);
            }

          }
        }
        this.trigger('rootRender');

      }


    },




    //mouse up event
    mouseUp: function(event) {

      for (var i = 0; i < this.selectedNodes.length; i++) {
        if(!this.selectedNodes[i].containsBehaviorName('followpath')){
        var intersection = this.selectedNodes[i].checkIntersection();
        if (intersection) {
          this.event_bus.trigger('newBehavior', [intersection.nodeParent, this.selectedNodes[i]], 'followpath');
          this.trigger('setState','selectTool');
        }
      }
    }

    },

    //mouse drag event
    mouseDrag: function(event) {
     
          if (this.currentNode) {

            for (var i = 0; i < this.selectedNodes.length; i++) {
              this.selectedNodes[i].updateSelected([{
               delta: {
                  x: event.delta.x,
                  y: event.delta.y
                },
                relative: event.point
              }]);
            }
            this.trigger('rootUpdate');
            this.trigger('rootRender');

          }


        
      
    },

    //mouse move event
    mouseMove: function(event) {

    }



  });

  return FollowPathToolModel;

});