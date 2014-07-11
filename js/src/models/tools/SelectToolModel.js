/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',
  'models/PaperManager',
  'models/behaviors/CopyBehavior',
  'models/data/BehaviorNode'

], function(_, Backbone, BaseToolModel, PathNode, PaperManager, CopyBehavior, BehaviorNode) {
  var segment, paper;


  var hitOptions = {
    segments: true,
    stroke: true,
    fill: true,
    tolerance: 5
  };

  var SelectToolModel = BaseToolModel.extend({
    defaults: _.extend({}, BaseToolModel.prototype.defaults, {}),

    initialize: function() {
      paper = PaperManager.getPaperInstance();
    },

    /*mousedown event
     */
    mouseDown: function(event) {

      var paper = PaperManager.getPaperInstance();
      segment = null;
      this.currentPath = null;
      this.currentNode = null;
      var hitResult = paper.project.hitTest(event.point, hitOptions);
      //deselect everything
      var children = paper.project.activeLayer.children;
      for (var i = 0; i < children.length; i++) {
        //if(children[i].data.instanceParent){
        //if(!children[i].data.instanceParent.anchor){
        children[i].selected = false;
        // } //}
      }

      if (hitResult) {
        this.currentPath = hitResult.item;
        //this sets currentNode depending on current selection level in tree
        this.trigger('nodeSelected', this.currentPath);
        console.log('current node is set in select tool to=' + this.currentNode.type);
        //if(this.currentNode.type='path');



        if (event.modifiers.shift) {
          var behaviorNode = new BehaviorNode();
          behaviorNode.addChildNode(this.currentNode);
          this.trigger('nodeAdded', behaviorNode);
          var copyBehavior = new CopyBehavior();
          copyBehavior.setCopyNum(2);
          behaviorNode.extendBehavior(copyBehavior, 'update');
          behaviorNode.update([{
            position: {
              x: 0,
              y: 0
            },
            scale: 1,
            rotation: 0
          }]);
          behaviorNode.render();
          this.currentNode = behaviorNode;

          //triggers parent to select current node level in graph
          //this.trigger('setCurrentNode', this.currentNode);
        }


        if (hitResult.type == 'segment') {
          segment = hitResult.segment;
        }

      }

    },

    dblClick: function(event) {
      console.log("double click");
      if (this.currentPath) {
        if (this.currentNode.getNumChildren() !== 0) {
          console.log("has child, moving down a layer");
          this.currentNode.selectAll(false);
          this.trigger("setCurrentNode", this.currentNode.getChildAt(0));
          this.trigger('nodeSelected', this.currentPath.nodeParent);
          // this.trigger('nodeSelected', this.currentNode.getChildAt(0));
          console.log('current node is set in select tool to=' + this.currentNode.type);

          //this.currentNode.selectAll(false);

        }

        //  this.path.instanceParent.isAnchor(!this.path.instanceParent.anchor);
      } else {
        this.trigger('moveUpNode');
        //console.log('current node is set in select tool to='+this.currentNode.type);

      }
    },


    //mouse up event
    mouseUp: function(event) {
      if (this.currentPath) {


      }
    },

    //mouse drag event
    mouseDrag: function(event) {
      if (segment) {
        console.log('dragging segment');
        segment.point = segment.point.add(event.delta);

        //path.smooth();
      } else if (this.currentPath) {
        console.log("delta is");
        console.log(event.delta);
        this.currentNode.update({
          position: {
            x: event.delta.x,
            y: event.delta.y
          },
          scale: 1,
          rotation: 0
        });
        this.currentNode.getParentNode().render([{
          position: {
            x: 0,
            y: 0
          },
          scale: 1,
          rotation: 0
        }]);

      }
    },

    //mouse move event
    mouseMove: function(event) {

    }



  });

  return SelectToolModel;

});