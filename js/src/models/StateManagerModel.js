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
 


], function($, _, Backbone, GeometryNode, ToolCollection, PenToolModel, PolyToolModel, SelectToolModel) {
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

    initialize: function(event_bus) {
      penTool = new PenToolModel({
        id: 'penTool'
      });
      selectTool = new SelectToolModel({
        id: 'selectTool'
      });
      polyTool = new PolyToolModel({
        id: 'polyTool'
      });

this.event_bus = event_bus;

      toolCollection = new ToolCollection([penTool, selectTool, polyTool]);
      this.listenTo(toolCollection, 'nodeAdded', this.nodeAdded);
      this.listenTo(toolCollection, 'nodeSelected', this.nodeSelected);
      this.listenTo(toolCollection, 'setSelection', this.setSelection);
      this.listenTo(toolCollection, 'setCurrentNode', this.setCurrentNode);
      this.listenTo(toolCollection, 'moveUpNode', this.moveUpNode);
      this.listenTo(toolCollection, 'moveDownNode', this.moveDownNode);

      this.listenTo(toolCollection, 'optionClick', this.openMenu);
      this.listenTo(toolCollection, 'rootRender', this.rootRender);
      this.listenTo(toolCollection, 'currentRender', this.currentRender);


      this.listenTo(event_bus, 'nodeAdded', this.nodeAdded);

      this.listenTo(event_bus, 'rootRender', this.rootRender);
      //this.listenTo(event_bus, 'currentRender', this.currentRender);


      this.listenTo(event_bus, 'moveDownNode', this.moveDownNode);

      
      rootNode = new GeometryNode();
      rootNode.type = 'root';
      currentNode = rootNode;


    },

    setState: function(state) {
      toolCollection.get(this.get('state')).reset();

      this.set('state', state);

    },

    //returns currently selected object as JSON object. If nothing is selected, returns the root object
    getSelected: function() {
      ////console.log('attempting to get selected'+rootNode.getChildAt(0));
      //currentNode = rootNode.getChildAt(0);
      return currentNode.toJSON();

    },

    //callback triggered when tool adds new node
    nodeAdded: function(node) {
      //console.log('node added: '+ node.type);
 
      currentNode.addChildNode(node);
           //console.log('number of children on root='+currentNode.getNumChildren());
      toolCollection.get(this.get('state')).currentNode = node;

    },

    moveUpNode: function(){
      //console.log('moveUpNode');
      this.setCurrentNode(currentNode);
       console.log('current node type='+currentNode.type);
       this.rootRender();
    },

    //moves down based on path
    moveDownNode: function(path){
      //console.log('move down node');
      var children = currentNode.children;
      for(var i=0;i<children.length;i++){
        if(children[i].containsPath(path)){
         // console.log('found path at child'+i);
            currentNode = children[i];
           toolCollection.get(this.get('state')).currentNode = children[i];
        }
      }
      console.log('current node type='+currentNode.type);
        // console.log('current node is root='+('root'===currentNode.type));
       this.rootRender();
    },

    /* sets correct selection based on currentNode
    * determines value by finding the hierarchical level of the current node
    * and using that level as an index to slice the render signature of the currently selected path
    * sends this as the starting value for selecting other relevant paths based on the current node
    */
   setSelection: function(path){
     // console.log('set selection');
   
      var index  = currentNode.getLevelInTree(rootNode,0);
      //console.log("selection level="+level);
      //console.log("render signature of path="+path.data.renderSignature);
      if(path.data.renderSignature[index]!==null){
        var value = path.data.renderSignature.slice(0,index+1);
        value = value.join();

        //console.log("selection value="+value);
        currentNode.selectByValue(index,value, path, currentNode);
      }
     
    },

    rootRender: function(){
      //console.log('called root render');
      rootNode.clear();
      rootNode.render(null,currentNode);
    },

    currentRender: function(){
      //console.log('called current render');
      currentNode.clear();
      currentNode.render(null,currentNode);
    },
    //callback triggered when tool navigates to specific node in tree;
    setCurrentNode: function(node){
     
      if(node.getParentNode()!==null){
         //console.log('current node is set in state to:' +node.getParentNode().type);
        currentNode = node.getParentNode();
      }
      else{
        //console.log('current node is set in state to:' +currentNode.type);

         
         
      }
    },

    //callback triggered when select tool selects shape
    nodeSelected: function(selected) {
      this.determineSelectionPoint(selected);
    },

   /*recursively follows parent hierarchy upwards to find correct selection point 
    * when selected node is found, it is assigned as the currently selected
    * node in the selected tool. 
    * TODO: make this assignment less janky.
    */
    determineSelectionPoint: function(selected) {
      //console.log('determining selection point');
      if (selected.nodeParent == currentNode) {
       toolCollection.get(this.get('state')).currentNode = currentNode;
         if(toolCollection.get(this.get('state')).selectedNodes.indexOf(selected)==-1){
            toolCollection.get(this.get('state')).selectedNodes.push(selected);
          }
        return;
      }
      if (selected == rootNode) {
        return;
      } else {
        this.determineSelectionPoint(selected.nodeParent);
      }
    },


    /* Called by select tool on Shift-click
    * pulls up the properties menu for the selected node
    */
    openMenu: function(node){
      this.event_bus.trigger('openMenu',node);
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
        //console.log('no behavior, assigning copy and distribute');
      //  var copyBehavior = new CopyBehavior();
        //var distributeBehavior = new DistributeBehavior();
        //distributeBehavior.initialize();
      //  copyBehavior.setCopyNum(2);
        //currentlySelected.extendBehavior(distributeBehavior, 'update');
        //currentlySelected.extendBehavior(copyBehavior, 'update');
      } else {
        //console.log('behavior exists. updating num');
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