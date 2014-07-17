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
      if(this.currentNode){
        this.currentNode.deselectAll();
      }
      var paper = PaperManager.getPaperInstance();
      segment = null;
      this.currentPath = null;
      this.currentNode = null;
      this.selectedNode = null;
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

        var path = hitResult.item;
        //this sets currentNode depending on current selection level in tree
        this.trigger('nodeSelected', path);

        //checks to make sure path is within current node
        if (this.selectedNode) {
          if (this.currentNode.containsPath(path)) {
                       this.currentPath = path;
            this.trigger('setSelection', path);
            this.trigger('currentRender');

            if (event.modifiers.shift) {
              this.trigger('shiftClick',this.selectedNode);
            }


            if (hitResult.type == 'segment') {
              segment = hitResult.segment;
            }
          }
        }

      }

    },

    dblClick: function(event) {
     // console.log('double click');
      if (this.currentPath) {

        this.trigger('moveDownNode', this.currentPath);



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
        // console.log('dragging segment');
        segment.point = segment.point.add(event.delta);

        //path.smooth();
      } else if (this.currentPath) {
        // console.log('delta is');
        if(this.currentNode){
         // console.log("selected Node =");
          //console.log(this.selectedNode);
          this.selectedNode.updateSelected([{
          position: {
            x: event.delta.x,
            y: event.delta.y
          }
        }]);
        this.currentNode.update([{}]);
        this.trigger('currentRender');
       
           //this.trigger('setSelection', this.currentPath);
         // console.log("re-render");
        }
        //console.log(event.delta);
        /* this.currentNode.update([{
          position: {
            x: event.delta.x,
            y: event.delta.y
          }
        }]);
        this.currentNode.getParentNode().render();*/

      }
    },

    //mouse move event
    mouseMove: function(event) {

    }



  });

  return SelectToolModel;

});