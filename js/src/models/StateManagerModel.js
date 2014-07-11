/*StateManagerModel.js
 *model that manages all base shapes*/

define([
  'jquery',
  'underscore',
  'backbone',
  'models/data/GeometryNode',
  'models/tools/ToolCollection',
  'models/tools/PenToolModel',
  'models/tools/PolyToolModel',
  'models/tools/SelectToolModel',
  'models/behaviors/CopyBehavior',
  'models/behaviors/DistributeBehavior'

], function($, _, Backbone, GeometryNode, ToolCollection, PenToolModel, PolyToolModel, SelectToolModel, CopyBehavior, DistributeBehavior) {
  var rootNode,
    currentNode,
    toolCollection,
    penTool,
    polyTool,
    selectTool;



  var StateManagerModel = Backbone.Model.extend({

    defaults: {
      'state': 'selectTool',
    },

    initialize: function() {
      penTool = new PenToolModel({
        id: 'penTool'
      });
      selectTool = new SelectToolModel({
        id: 'selectTool'
      });
      polyTool = new PolyToolModel({
        id: 'polyTool'
      });

      toolCollection = new ToolCollection([penTool, selectTool, polyTool]);
      this.listenTo(toolCollection, 'nodeAdded', this.nodeAdded);
      this.listenTo(toolCollection, 'shapeSelected', this.shapeSelected);
      this.listenTo(toolCollection, 'setCurrentNode', this.setCurrentNode);

      rootNode = new GeometryNode();
      currentNode = rootNode;


    },

    setState: function(state) {
      toolCollection.get(this.get('state')).reset();

      this.set('state', state);

    },

    //returns currently selected object as JSON object. If nothing is selected, returns the root object
    getSelected: function() {
      //console.log('attempting to get selected'+rootNode.getChildAt(0));
      //currentNode = rootNode.getChildAt(0);
      return currentNode.toJSON();

    },

    //callback triggered when tool adds new node
    nodeAdded: function(node) {
      console.log('node added: '+ node.type);
     //console.log(node);
      rootNode.addChildNode(node);
      currentNode = rootNode;



    },

    //callback triggered when tool navigates to specific node in tree;
    setCurrentNode: function(node){
      console.log('current node is set in state to:' +node.type);
      currentNode = node;
    },

    //callback triggered when select tool selects shape
    shapeSelected: function(selected) {
      //console.log('node selected');
      //console.log(selected);

      this.determineSelectionPoint(selected, true);

    },

    /*recursively follows parent hierarchy upwards to find correct selection point 
    * when selected node is found, it is assigned as the currently selected
    * node in the selected tool. 
    * TODO: make this assignment less janky.
    */
    determineSelectionPoint: function(selected, toggle) {
      if (selected.getParentNode() == currentNode) {
        selected.selectAll(toggle);
       toolCollection.get(this.get('state')).currentNode = selected;
        return;
      }
      if (selected == rootNode) {
        return;
      } else {
        this.determineSelectionPoint(selected.getParentNode(),toggle);
      }
    },

    //triggered by paper tool on a mouse down event
    toolMouseDown: function(event) {
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.mouseDown(event);


    },

    toolMouseUp: function(event) {
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.mouseUp(event);

    },


    toolMouseDrag: function(event) {
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.mouseDrag(event);
    },


    toolMouseMove: function(event) {
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.mouseMove(event);
    },

    canvasMouseWheel: function(event) {

      var selectedTool = toolCollection.get(this.get('state'));
      var currentlySelected = selectedTool.path.instanceParent.nodeParent;
      if (!_.has(currentlySelected, 'copyNum')) {
        console.log('no behavior, assigning copy and distribute');
        var copyBehavior = new CopyBehavior();
        var distributeBehavior = new DistributeBehavior();
        distributeBehavior.initialize();
        copyBehavior.setCopyNum(2);
        currentlySelected.extendBehavior(distributeBehavior, 'update');
        currentlySelected.extendBehavior(copyBehavior, 'update');
      } else {
        console.log('behavior exists. updating num');
        currentlySelected.setCopyNum(currentlySelected.copyNum + 1);
      }

      currentlySelected.update();



    },

    canvasDblclick: function(event) {
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.dblClick(event);

    },

    //called when escape key is pressed in canvas
    escapeEvent: function() {

    },



  });

  return StateManagerModel;

});