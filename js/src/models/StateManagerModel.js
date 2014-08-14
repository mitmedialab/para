/*StateManagerModel.js
 *model that manages all base shapes*/

define([
  'jquery',
  'underscore',
  'backbone',
  'models/data/GeometryNode',
    'models/data/PathNode',

  'models/tools/ToolCollection',
  'models/tools/PenToolModel',
  'models/tools/PolyToolModel',
  'models/tools/SelectToolModel',
     'models/behaviors/BehaviorManagerModel',

  'models/PaperManager',


  'filesaver'
 


], function($, _, Backbone, GeometryNode, PathNode, ToolCollection, PenToolModel, PolyToolModel, SelectToolModel, BehaviorManagerModel,PaperManager, FileSaver) {
  var rootNode,
    currentNode,
    toolCollection,
    penTool,
    polyTool,
    selectTool,
    paper,
    mousePos;



  var StateManagerModel = Backbone.Model.extend({

    defaults: {
      'state': 'selectTool',
    },

    initialize: function(event_bus, behaviorManager) {
      //console.log(new FileSaver());
      paper = PaperManager.getPaperInstance();
      penTool = new PenToolModel({
        id: 'penTool'
      });
      selectTool = new SelectToolModel({
        id: 'selectTool'
      });
      selectTool.event_bus = event_bus;
      polyTool = new PolyToolModel({
        id: 'polyTool'
      });
      this.behaviorManager = behaviorManager;

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
            this.listenTo(toolCollection, 'rootUpdate', this.rootUpdate);

      this.listenTo(toolCollection, 'currentRender', this.currentRender);


      this.listenTo(event_bus, 'nodeAdded', this.nodeAdded);

      this.listenTo(event_bus, 'rootRender', this.rootRender);
      //this.listenTo(event_bus, 'currentRender', this.currentRender);


      this.listenTo(event_bus, 'moveDownNode', this.moveDownNode);
      this.behaviorManager = new BehaviorManagerModel(event_bus);
      
      rootNode = new GeometryNode();
      rootNode.type = 'root';
      currentNode = rootNode;

      /*var path =  new paper.Path();
      path.strokeColor = 'red';

      path.add(new paper.Point(300,0));
      path.add(new paper.Point(800,300));

     var path2 =  new paper.Path();
      path2.strokeColor = 'green';

      path2.add(new paper.Point(500,0));
      path2.add(new paper.Point(0,500));
   

      var conditional_line = new PathNode();
      conditional_line.name = 'path_cond';
      
      conditional_line.createInstanceFromPath(path);
     
      this.nodeAdded(conditional_line);*/
    
      this.rootRender();
        /*       var intersections = conditional_line.checkIntersection();

       console.log('test intersection=');
      console.log(intersections);*/
      //this.event_bus.trigger('sendTestObj',conditional_line);

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

    resetTools: function(){
      toolCollection.get(this.get('state')).reset();

    },

    //callback triggered when tool adds new node
    nodeAdded: function(node) {
      //console.log('node added: '+ node.type);
      currentNode.addChildNode(node);
      toolCollection.get(this.get('state')).currentNode = node;

    },

    moveUpNode: function(){
      this.setCurrentNode(currentNode);
       //console.log('current node type='+currentNode.type);
       this.rootRender();
    },

    //moves down based on path
    moveDownNode: function(path){
      var children = currentNode.children;
      for(var i=0;i<children.length;i++){
        if(children[i].containsPath(path)&&children[i].type!='path'){
            currentNode = children[i];
           toolCollection.get(this.get('state')).currentNode = children[i];
        }
      }
      //console.log('current node type='+currentNode.type);
       this.rootRender();
    },

    /* sets correct selection based on currentNode
    * determines value by finding the hierarchical level of the current node
    * and using that level as an index to slice the render signature of the currently selected path
    * sends this as the starting value for selecting other relevant paths based on the current node
    */
   setSelection: function(path){
   
      var index  = currentNode.getLevelInTree(rootNode,0);
      if(path.data.renderSignature[index]!==null){
        var value = path.data.renderSignature.slice(0,index+1);
        value = value.join();

        currentNode.selectByValue(index,value, path, currentNode);

      }
     
    },

    rootRender: function(){
     //console.log('called root render');
    
      rootNode.clearObjects();
      rootNode.render(null,currentNode);

      var numChildren = paper.project.activeLayer.children.length;
      this.trigger('renderComplete');
     // console.log('total number of children='+numChildren);
     // console.log( paper.project.activeLayer.children);
    },

    rootUpdate: function(){
     //console.log('called root render');
    
      rootNode.update([{}]);
      
    },
    currentRender: function(){
      //console.log('called current render');
      currentNode.clearObjects();
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
      if(selected.nodeParent){
      if (selected.nodeParent == currentNode) {
       toolCollection.get(this.get('state')).currentNode = currentNode;
         if(toolCollection.get(this.get('state')).selectedNodes.indexOf(selected)==-1){
            toolCollection.get(this.get('state')).selectedNodes.push(selected);
         
            this.event_bus.trigger('nodeSelected',selected);

          }
        return;
      }
      if (selected == rootNode) {
        return;
      } else {
        this.determineSelectionPoint(selected.nodeParent);
      }
    }
    },


    /* Called by select tool on Shift-click
    * pulls up the properties menu for the selected node
    */
    openMenu: function(node){
      this.event_bus.trigger('openMenu',node);
    },

    //triggered by paper tool on a mouse down event
    toolMouseDown: function(event, pan) {
      if(!pan){
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.mouseDown(event);
    }


    },

    toolMouseUp: function(event, pan) {
      if(!pan){
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.mouseUp(event);
    }

    },


    toolMouseDrag: function(event, pan) {
      if(!pan){
        var selectedTool = toolCollection.get(this.get('state'));
        selectedTool.mouseDrag(event);
      }
      
    },

   canvasMouseDrag: function(delta, pan) {
      if(pan){
       var inverseDelta=new paper.Point(-delta.x/paper.view.zoom,-delta.y/paper.view.zoom);
        paper.view.scrollBy(inverseDelta);
         event.preventDefault();
        //paper.view.draw();
        
      }
     
      
    },

    changeZoom: function(oldZoom, delta, c, p){
      var newZoom = this.calcZoom(oldZoom, delta);
      var beta = oldZoom / newZoom;
      var pc = p.subtract(c);
      var a = p.subtract(pc.multiply(beta)).subtract(c);
      return{z:newZoom, o:a};
    },

    calcZoom: function(oldZoom, delta){
      var factor = 1.05;
      if (delta < 0){
        return oldZoom * factor;
      }
      if (delta > 0){
        return oldZoom/factor;
      }
    },
      changeCenter: function(oldCenter, delta, factor){
      var offset = new paper.Point(-delta.x, -delta.y);
     // offset = offset.multiply(factor);
      var newCenter = oldCenter.add(offset);
      return newCenter;

    },



    toolMouseMove: function(event,pan) {
      if(!pan){
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.mouseMove(event);
    }
     
     
    },

    canvasMouseWheel: function(event, pan, mousePos) {
     if(pan){
       var delta = event.originalEvent.wheelDelta;  //paper.view.center
       var mousePos = new paper.Point(event.offsetX,event.offsetY); 

       
        var viewPosition = paper.view.viewToProject(mousePos);
        var data =this.changeZoom(paper.view.zoom, delta, paper.view.center, viewPosition);
        paper.view.zoom = data.z;
        paper.view.center = paper.view.center.add(data.o);
        event.preventDefault();
        paper.view.draw();
      }
    


    },

    canvasDblclick: function(event) {
      var selectedTool = toolCollection.get(this.get('state'));
      selectedTool.dblClick(event);

    },

    //called when escape key is pressed in canvas
    escapeEvent: function() {

    },

    save: function(filename){
      

      var data = rootNode.exportJSON();
      var blob = new Blob([JSON.stringify(data)], {type: 'text/plain;charset=utf-8'});
      var fileSaver = new FileSaver(blob,filename);
    },

     export: function(filename){

      var data =paper.project.exportSVG( { asString: true});
      var blob = new Blob([data], {type: 'image/svg+xml'});
      var fileSaver = new FileSaver(blob,filename);
    },

    load: function(loadObj){
      rootNode.deleteChildren();
      var children = loadObj.children;
     this.parseJSON(rootNode,children);
     this.rootUpdate();
     this.rootRender();
      //console.log(children);
    },

    parseJSON: function (currentNode,data){
      for(var i=0;i<data.length;i++){
        var type = data[i].type;
        var node;
        switch(type){
          case 'path':
          node = new PathNode(data[i]);
          break; 
         default:
          node = new GeometryNode(data[i]);
          break; 
        }
        node.type = type;
        node.name = data[i].name;
        currentNode.addChildNode(node);
        for(var j=0;j<data[i].behaviors.length;j++){
          var behavior = data[i].behaviors[j];
          console.log("parsing behavior:"+behavior.name);
          this.behaviorManager.newBehavior([node],behavior.name,behavior);
        }
        
        if(data[i].children.length>0){
          this.parseJSON(node,data[i].children);
        }


      }
    },

    updateStroke: function(width){
      if(selectTool.selectedNodes.length>0){
        for(var i=0;i<selectTool.selectedNodes.length;i++){
         selectTool.selectedNodes[i].updateSelected([{strokeWidth:Number(width)}]);
        }
      }
      currentNode.update([{}]);
      this.rootRender();
     paper.view.draw();  
    },

     updateColor: function(color,type){
      console.log('update color');
      if(selectTool.selectedNodes.length>0){
        
        var update;
        if(type=='stroke'){
          update = [{strokeColor:color}];
        }
        else{
          update = [{fillColor:color}];

        }
        for(var i=0;i<selectTool.selectedNodes.length;i++){
          
         selectTool.selectedNodes[i].updateSelected(update);
        }
      }
      currentNode.update([{}]);
      this.rootRender();
     paper.view.draw();  
    },

    deleteObject: function(){
       if(selectTool.selectedNodes.length>0){
        for(var i=0;i<selectTool.selectedNodes.length;i++){
         selectTool.selectedNodes[i].deleteNode();
        }
      }
      currentNode.update([{}]);
      this.rootRender();
     paper.view.draw();  
    },

  });

  return StateManagerModel;

});