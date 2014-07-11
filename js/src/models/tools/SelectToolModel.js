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
      this.path=null;
      var hitResult = paper.project.hitTest(event.point, hitOptions);
      var children = paper.project.activeLayer.children;
      for(var i=0;i<children.length;i++){
        //if(children[i].data.instanceParent){
          //if(!children[i].data.instanceParent.anchor){
            children[i].selected = false;
         // }
        //}
      }

      if (hitResult) {
        this.currentPath = hitResult.item; 
        this.trigger('shapeSelected', this.currentPath.data.nodeParent);
       
        console.log('selected node type='+this.currentNode.type);
        



        if(event.modifiers.shift){
          var behaviorNode = new BehaviorNode();
          behaviorNode.addChildNode(this.currentNode);
          this.trigger('nodeAdded',behaviorNode);
          var copyBehavior = new CopyBehavior();
          copyBehavior.setCopyNum(2);
          behaviorNode.extendBehavior(copyBehavior, 'render');
          behaviorNode.render([{position:{x:0,y:0},scale:1,rotation:0}]);
          this.currentNode = behaviorNode;

          //triggers parent to select current node level in graph
        //this.trigger('setCurrentNode', this.currentNode);
        }
        
       
        if (hitResult.type == 'segment') {
          segment = hitResult.segment;
        } 
     
      }

    },

    dblClick: function(event){
      if(this.path){
        this.path.instanceParent.isAnchor(!this.path.instanceParent.anchor);
      }
    },


    //mouse up event
    mouseUp: function(event) {
      if (this.path) {

        this.path.fire('mouseup', event);

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
        this.currentNode.update({position:{x:event.delta.x,y:event.delta.y}, scale:1, rotation:0});
        this.currentNode.render([{position:{x:0,y:0},scale:1,rotation:0}]);

      }
    },

    //mouse move event
    mouseMove: function(event) {
     
    }



  });

  return SelectToolModel;

});