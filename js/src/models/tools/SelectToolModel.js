/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',
  'models/PaperManager',
    'utils/analytics'


], function(_, Backbone, BaseToolModel, PathNode, PaperManager, analytics) {
  var segment, instanceIndex, handle;
  var paper = PaperManager.getPaperInstance();
  var eventType = 'shapeSelected';


  var hitOptions = {
    segments: true,
    stroke: true,
    handles: true,
    fill: true,
    tolerance: 2
  };

  var SelectToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {}),

    initialize: function() {
      this.selectedNodes = [];
      this.currentPaths = [];
      this.segmentMod = false;
      this.moved = null;
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
        this.moved = null;

        this.selectedNodes = [];
        this.trigger('selectionReset');
        ////console.log("setting selected nodes to null");
      }

      segment = null;

      var hitResult = paper.project.hitTest(event.point, hitOptions);
     
      //deselect everything
      var children = paper.project.activeLayer.children;
      for (var i = 0; i < children.length; i++) {
        children[i].selected = false;
      }

      if (hitResult) {

        var path = hitResult.item;
        instanceIndex = path.instanceIndex;
        analytics.log(eventType,{type:eventType,id:'shape',action:'selected'});

        ////console.log(hitResult);
        if (hitResult.type == 'segment') {
          console.log('hit segment');
          segment = hitResult.segment.index;
          console.log("segment",segment);
          segment.fullySelected = true;
      analytics.log(eventType,{type:eventType,id:'segment',action:'selected'});


        }
        else if(hitResult.type =='handle-in'|| hitResult.type =='handle-out'){
          handle= hitResult.type;
          segment = hitResult.segment.index;
          analytics.log(eventType,{type:eventType,id:'handle',action:'selected'});

        }

        //this sets currentNode depending on current selection level in tree
        this.trigger('nodeSelected', path);

        //checks to make sure path is within current node
        if (this.selectedNodes.length > 0) {
          if (this.currentNode.containsPath(path)) {
            if (this.currentPaths.indexOf(path) == -1) {
              this.currentPaths.push(path);
            }
            this.trigger('setSelection', path);
            this.trigger('updateProperties');
            if (event.modifiers.option) {
              this.trigger('optionClick', this.selectedNodes[this.selectedNodes.length - 1]);
            }

          }
        }
        this.trigger('rootChange',true);
        this.trigger('rootRender');

      }


    },

    dblClick: function(event) {
      if (this.currentPaths.length > 0) {
        this.trigger('moveDownNode', this.currentPaths[this.currentPaths.length - 1]);
      } else {
        this.trigger('moveUpNode');
      }
    },


    //mouse up event
    mouseUp: function(event) {
      if(this.moved!==null){
        this.trigger('rootChange',false);
        analytics.log(eventType,{type:eventType,id:this.moved,action:'moved'});
        this.moved=null;
      }

    },

    //mouse drag event
    mouseDrag: function(event) {
      if (this.currentPaths.length > 0) {

        if (segment !== null) {
          if (this.currentNode) {
            var selPath = this.selectedNodes[this.selectedNodes.length - 1].instance_literals[instanceIndex];
            if (selPath && (selPath.nodeParent.type === 'path' || selPath.nodeParent.type === 'polygon')) {
             
              selPath.nodeParent.updatePath(segment,instanceIndex,event.delta,handle);
              this.trigger('rootUpdate');
              this.trigger('rootRender');
              this.moved = 'segment';

            }
          }


        } else {
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
            this.moved = 'path';
          }


        }
      }
    },

    //mouse move event
    mouseMove: function(event) {

    }



  });

  return SelectToolModel;

});