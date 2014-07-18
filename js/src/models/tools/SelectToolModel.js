/*SelectToolModel.js
 *base model class for all direct manipulation tool models*/

define([
  'underscore',
  'backbone',
  'models/tools/BaseToolModel',
  'models/data/PathNode',
  'models/PaperManager'

], function(_, Backbone, BaseToolModel, PathNode, PaperManager) {
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
      this.selectedNodes = [];
      this.currentPaths = [];
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
        this.selectedNodes = [];
      }
      var paper = PaperManager.getPaperInstance();
      segment = null;

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
        if (this.selectedNodes.length > 0) {
          if (this.currentNode.containsPath(path)) {
            if(this.currentPaths.indexOf(path)==-1){
               this.currentPaths.push(path);
             }
            this.trigger('setSelection', path);


            if (event.modifiers.option) {
              this.trigger('optionClick', this.selectedNodes[this.selectedNodes.length - 1]);
            }


            if (hitResult.type == 'segment') {
              segment = hitResult.segment;
            }
          }
        }

      }
      this.trigger('rootRender');

    },

    dblClick: function(event) {
      // console.log('double click');
      if (this.currentPaths.length > 0) {

        this.trigger('moveDownNode', this.currentPaths[this.currentPaths.length - 1]);



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
        segment.point = segment.point.add(event.delta);

      
      } 
      else if (this.currentPaths.length > 0) {
      
        if (this.currentNode) {
      
          for (var i = 0; i < this.selectedNodes.length; i++) {
            this.selectedNodes[i].updateSelected([{
              position: {
                x: event.delta.x,
                y: event.delta.y
              }
            }]);
          }
          this.currentNode.update([{}]);
          this.trigger('rootRender');
        }
       

      }
    },

    //mouse move event
    mouseMove: function(event) {

    }



  });

  return SelectToolModel;

});