/*StateManagerModel.js
 *model that manages all base shapes*/

define([
    'jquery',
    'underscore',
    'backbone',
    'backbone.undo',
    'models/data/GeometryNode',
    'models/data/PathNode',
    'models/data/PolygonNode',
    'models/data/Instance',
    'models/tools/ToolCollection',
    'models/tools/PenToolModel',
    'models/tools/PolyToolModel',
    'models/tools/SelectToolModel',
    'models/tools/RotateToolModel',
    'models/tools/FollowPathToolModel',
    'models/PaperManager',
    'filesaver',
    'models/behaviors/actions/BlockNode',
    'models/behaviors/actions/InitializeNode',
    'models/behaviors/actions/TranslateNode',
    'models/behaviors/actions/RotateNode',
    'models/data/Visitor',
    'models/data/Edge'


  ],

  function($, _, Backbone, UndoManager, GeometryNode, PathNode, PolygonNode, Instance, ToolCollection, PenToolModel, PolyToolModel, SelectToolModel, RotateToolModel, FollowPathToolModel, PaperManager, FileSaver, BlockNode, InitializeNode, TranslateNode, RotateNode, Visitor, Edge) {
    var rootNode,
      visitor,
      currentNode,
      toolCollection,
      penTool,
      polyTool,
      selectTool,
      rotateTool,
      followPathTool,
      paper,
      clutch;

    var undoManager;

    var undoLimit = 15;


    var StateManagerModel = Backbone.Model.extend({

      defaults: {
        'state': 'polyTool',
      },

      initialize: function(event_bus) {
        clutch = 0;
        paper = PaperManager.getPaperInstance();
        this.event_bus = event_bus;

        //setup user tool managers
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
        rotateTool = new RotateToolModel({
          id: 'rotateTool'
        });
        followPathTool = new FollowPathToolModel({
          id: 'followPathTool'

        });
        followPathTool.event_bus = event_bus;
        toolCollection = new ToolCollection([polyTool,penTool, selectTool, rotateTool, followPathTool]);


        /* event listener registers */
        this.listenTo(toolCollection,"geometryAdded",this.geometryAdded);
        this.listenTo(toolCollection,"geometrySelected",this.geometrySelected);
        this.listenTo(toolCollection,"geometryIncremented",this.geometryIncremented);
        this.listenTo(toolCollection,"geometryCopied",this.geometryCopied);

        this.listenTo(toolCollection, 'nodeSelected', this.nodeSelected);
        this.listenTo(toolCollection, 'setSelection', this.setSelection);
        this.listenTo(toolCollection, 'updateProperties', this.updateProperties);

        this.listenTo(toolCollection, 'setCurrentNode', this.setCurrentNode);
        this.listenTo(toolCollection, 'moveUpNode', this.moveUpNode);
        this.listenTo(toolCollection, 'moveDownNode', this.moveDownNode);
        this.listenTo(toolCollection, 'selectionReset', this.selectionReset);

        this.listenTo(toolCollection, 'optionClick', this.openMenu);
        // this.listenTo(toolCollection, 'rootRender', this.rootRender);
        //this.listenTo(toolCollection, 'rootChange', this.rootChange);

        this.listenTo(toolCollection, 'rootUpdate', this.rootUpdate);
        this.listenTo(toolCollection, 'getSelection', this.getSelection);

        this.listenTo(toolCollection, 'currentRender', this.currentRender);
        this.listenTo(toolCollection, 'setState', this.setState);

        // this.listenTo(event_bus, 'rootUpdate', this.rootUpdate);
        //this.listenTo(event_bus, 'rootRender', this.rootRender);
        this.listenTo(event_bus, 'moveDownNode', this.moveDownNode);
        this.listenTo(event_bus, 'moveUpNode', this.moveUpNode);


        //setup visitor
        visitor = new Visitor();


        //setup root node
        rootNode = new Instance(null);
        rootNode.type = 'root';
        this.listenTo(rootNode, 'parseJSON', this.parseJSON);
        currentNode = rootNode;


        //clear local storage
        localStorage.clear();
        this.modified = false;


        //setup undo manager
        Backbone.UndoManager.removeUndoType("change");
        var beforeCache;
        Backbone.UndoManager.addUndoType("change:isChanging", {
          "on": function(model, isChanging, options) {
            if (isChanging) {
              beforeCache = model.exportJSON();
            } else {
              return {
                "object": model,
                "before": beforeCache,
                "after": model.exportJSON()
              };
            }
          },
          "undo": function(model, before, after, options) {
            model.undoRedo(before);
          },
          "redo": function(model, before, after, options) {
            model.undoRedo(after);
          }
        });

        undoManager = new Backbone.UndoManager({
          track: true,
          register: rootNode
        });


        //setup default zeros for zoom and pan
        this.zeroedZoom = paper.view.zoom;
        this.zeroedPan = paper.view.center.clone();

      },

      undo: function() {
        console.log("action is available", undoManager.isAvailable());
        undoManager.undo();
        // this.rootUpdate();
        //this.rootRender();
        paper.view.draw();

      },

      redo: function() {
        undoManager.redo();
        //this.rootUpdate();
        //this.rootRender();
        paper.view.draw();


      },

      toggleClutch: function() {
        switch (clutch) {
          case 0:
            clutch = 1;
            break;
          case 1:
            clutch = 2;
            break;
          case 2:
            clutch = 0;
            break;
        }
        //this.rootRender();

      },

      setState: function(state) {
        toolCollection.get(this.get('state')).reset();

        this.set('state', state);
        if (state === 'penTool' || state === 'polyTool') {
          console.log('move to root');
          this.moveToRoot();

        }

      },



      resetTools: function() {
        toolCollection.get(this.get('state')).reset();

      },

      /* geometryAdded
       * callback that is triggered when a new geometry
       * object is created by the user
       * creates an init/translate procedure block based on the data
       * of the geometry, adds the geometry node as a child of the
       * procedure block and adds the procedure block to the scenegraph
       */
      geometryAdded: function(event) {
        selectTool.deselectAll();
        var currentTool = toolCollection.get(this.get('state'));
        var paperObjects = currentTool.get('literals');
        var matrix = currentTool.get('matrix');
        for(var i=0;i<paperObjects.length;i++){
          var pathNode = new PolygonNode();
          var data = pathNode.normalizePath(paperObjects[i], matrix);
          var instance = new Instance({
            protoNode: pathNode,
            selected: true
        });
        selectTool.addSelectedShape(instance);
       instance.update(data);
        var edge = new Edge({
          x: currentNode,
          y: instance
        });
        currentNode.addChildNode(instance);
        instance.addEdge(edge);
        visitor.addGeomFunction(pathNode);
        }
      currentTool.set('literals',[]);

        this.compile();
      },

      geometryCopied: function(event){
        console.log('geometryCopied');
         var selectedShapes = selectTool.get('selected_shapes');
        for(var i=selectedShapes.length-1;i>=0;i--){
          var instance = selectedShapes[i];
          var clone = instance.cloneInstance();
          
          var edge = new Edge({
            x: currentNode,
            y: instance
          });

          edge.addAll();
          instance.addChildNode(clone);
          clone.addEdge(edge);
          clone.set('selected',false);
          instance.set('selected',false);
          selectedShapes[i]=clone;
        }
        this.compile();
      },

      /* geometrySelected
       * callback that is triggered when a new geometry
       * object is selected by the user
       * creates an init/translate procedure block based on the data
       * of the geometry, adds the geometry node as a child of the
       * procedure block and adds the procedure block to the scenegraph
       */
      geometrySelected: function(event){
        var currentTool = toolCollection.get(this.get('state'));
        var paperObjects = currentTool.get('literals');
         for(var i=0;i<paperObjects.length;i++){
            var paperObject = paperObjects[i];
            console.log(paperObject);
            var instance = paperObject.data.instance;

            instance.getLinkedDimensions({top:true});
            selectTool.addSelectedShape(instance);
         }

         this.compile();
      },

      /* geometryIncremented
       * callback that is triggered when a geometry is transformed
       * by the user. Iterates through currently selected shapes
       * and updates their deltas based on the transformation
       * compiles graph and then iterates through a second time
       * to display bounding boxes
       * TODO: design so that only one iteration is neccesary?
       */
      geometryIncremented: function(data){
        var selectedShapes = selectTool.get('selected_shapes');
        for(var i=0;i<selectedShapes.length;i++){
          console.log("incrementing instance at",i);
          var instance = selectedShapes[i];
          instance.incrementDelta(data);
          
        }
        this.compile();

        for(var j=0;j<selectedShapes.length;j++){
          var inst = selectedShapes[j];
          inst.getLinkedDimensions({top:true});
        }
      },

      /* compile
       * resets the geometry functions
       * to remove all active instances and then
       * visits the root node to
       * begin the rendering process
       */
      compile: function() {
        visitor.resetGeomFunctions();
        visitor.visit(rootNode, null);
        //debugging code to count # of paperjs objects
      /*  var numChildren = paper.project.activeLayer.children.length;
        console.log('total number of children='+numChildren);*/
      },


      //=======================BEGIN SELECTION METHODS=======================//
      /* sets correct selection based on currentNode
       * determines value by finding the hierarchical level of the current node
       * and using that level as an index to slice the render signature of the currently selected path
       * sends this as the starting value for selecting other relevant paths based on the current node
       */
      setSelection: function(path) {

        var index = currentNode.getLevelInTree(rootNode, 0);
        if (path.data.renderSignature[index] !== null) {
          var value = path.data.renderSignature.slice(0, index + 1);
          value = value.join();

          currentNode.selectByValue(index, value, path, currentNode);

        }

      },

      updateProperties: function(data) {
        console.log('updateProperties');
        var selectedNodes = toolCollection.get(this.get('state')).selectedNodes;
        this.trigger('pathSelected', selectedNodes[selectedNodes.length - 1]);

      },


      getSelection: function() {

        toolCollection.get(this.get('state')).selectedNodes = selectTool.selectedNodes;


      },

      //=======================END SELECTION METHODS=======================//

      moveUpNode: function() {
        this.setCurrentNode(currentNode);
        ////console.log('current node type='+currentNode.type);
        //this.rootRender();
      },

      moveToRoot: function() {
        if (currentNode !== rootNode) {
          this.setCurrentNode(rootNode.children[0]);
        }
        // this.rootRender();
      },
      //moves down based on path
      moveDownNode: function(path) {
        var children = currentNode.children;
        for (var i = 0; i < children.length; i++) {
          if (children[i].containsPath(path) && children[i].type != 'path' && children[i].type != 'polygon') {
            currentNode = children[i];
            toolCollection.get(this.get('state')).currentNode = children[i];
          }
        }
        ////console.log('current node type='+currentNode.type);
        //this.rootRender();
      },

      //callback triggered when tool navigates to specific node in tree;
      setCurrentNode: function(node) {

        if (node.getParentNode() !== null) {
          ////console.log('current node is set in state to:' +node.getParentNode().type);
          currentNode = node.getParentNode();
        } else {
          ////console.log('current node is set in state to:' +currentNode.type);



        }
      },

      /*recursively follows parent hierarchy upwards to find correct selection point 
       * when selected node is found, it is assigned as the currently selected
       * node in the selected tool.
       * TODO: make this assignment less janky.
       */
      determineSelectionPoint: function(selected) {
        ////console.log('determining selection point');
        if (selected.nodeParent) {
          if (selected.nodeParent == currentNode) {
            toolCollection.get(this.get('state')).currentNode = currentNode;
            if (toolCollection.get(this.get('state')).selectedNodes.indexOf(selected) == -1) {
              toolCollection.get(this.get('state')).selectedNodes.push(selected);
              this.event_bus.trigger('nodeSelected', selected);


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

      /*returns currently selected shapes*/

      getSelected: function() {
        return toolCollection.get(this.get('state')).selectedNodes;
      },


      /* Called by select tool on Shift-click
       * pulls up the properties menu for the selected node
       */
      openMenu: function(node) {
        this.event_bus.trigger('openMenu', node);
      },

      //triggered by paper tool on a mouse down event
      toolMouseDown: function(event, pan) {
        if (!pan) {
          var selectedTool = toolCollection.get(this.get('state'));
          selectedTool.mouseDown(event);
          if (this.get('state') === 'penTool') {
            this.modified = true;
            this.trigger('disableSave', !this.modified);
          }
        }


      },

      toolMouseUp: function(event, pan) {
        if (!pan) {
          var selectedTool = toolCollection.get(this.get('state'));
          selectedTool.mouseUp(event);
        }

      },


      toolMouseDrag: function(event, pan) {
        if (!pan) {
          var selectedTool = toolCollection.get(this.get('state'));
          selectedTool.mouseDrag(event);
        }

      },

      canvasMouseDrag: function(delta, pan) {
        if (pan) {
          console.log('paper start', paper.view.center);
          var inverseDelta = new paper.Point(-delta.x / paper.view.zoom, -delta.y / paper.view.zoom);
          paper.view.scrollBy(inverseDelta);
          console.log('paper end', paper.view.center);

          event.preventDefault();
        }
      },

      changeZoom: function(oldZoom, delta, c, p) {
        var newZoom = this.calcZoom(oldZoom, delta);
        var beta = oldZoom / newZoom;
        var pc = p.subtract(c);
        var a = p.subtract(pc.multiply(beta)).subtract(c);
        return {
          z: newZoom,
          o: a
        };
      },

      calcZoom: function(oldZoom, delta) {
        var factor = 1.05;
        if (delta < 0) {
          return oldZoom * factor;
        }
        if (delta > 0) {
          return oldZoom / factor;
        }
      },



      toolMouseMove: function(event, pan) {
        if (!pan) {
          var selectedTool = toolCollection.get(this.get('state'));
          selectedTool.mouseMove(event);
        }


      },

      canvasMouseWheel: function(event, pan, modify) {
        //console.log(  event.originalEvent.wheelDelta);
        var delta = event.originalEvent.wheelDelta; //paper.view.center

        if (pan) {

          var mousePos = new paper.Point(event.offsetX, event.offsetY);

          var viewPosition = paper.view.viewToProject(mousePos);
          var data = this.changeZoom(paper.view.zoom, delta, paper.view.center, viewPosition);
          paper.view.zoom = data.z;
          paper.view.center = paper.view.center.add(data.o);
          event.preventDefault();
          paper.view.draw();
        } else if (modify) {
          event.preventDefault();
          // if(delta>3|| delta<-3){

          var update = 1;
          if (event.originalEvent.wheelDelta < 0) {
            update = -1;
          }
          this.updateCopyNum(update);
          //}
        }



      },

      canvasDblclick: function(event) {
        var selectedTool = toolCollection.get(this.get('state'));
        selectedTool.dblClick(event);

      },

      //called when escape key is pressed in canvas
      escapeEvent: function() {

      },

      saveFile: function(id, filename) {
        //console.log('id='+id);
        if (this.modified) {
          id = this.save(filename);
          //console.log('id='+id);
        }
        //console.log('id='+id);
        var data = localStorage[id];
        var blob = new Blob([data], {
          type: 'text/plain;charset=utf-8'
        });
        var fileSaver = new FileSaver(blob, filename);
        return id;
      },

      save: function() {

        var id = Date.now();
        //console.log('saving with name:' + id);
        var data = JSON.stringify(rootNode.exportJSON());

        this.saveToLocal(id, data);

        //console.log(localStorage[id]);
        this.trigger('localSaveComplete', id);
        //console.log('completed saving');
        this.modified = false;
        this.trigger('disableSave', !this.modified);
        return id;
      },

      saveToLocal: function(id, data) {
        var saved = false;
        //console.log(localStorage.length);
        while (localStorage.length > undoLimit - 1) {
          // try {

          //} catch (e) {
          var arr = [];
          for (var key in localStorage) {
            if (localStorage.hasOwnProperty(key) && !isNaN(key)) {
              arr.push(key);
            }
          }

          arr.sort(function(a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
          });
          //console.log('array=');
          //console.log(arr);
          this.trigger('removeItem', arr[0]);
          localStorage.removeItem(arr[0]);

          //}
        }
        localStorage.setItem(id, data);
        saved = true;
      },


      loadLocal: function(filename) {
        //console.log('loading with name:' + filename);

        var data = localStorage[filename];
        //console.log(data);
        this.load(JSON.parse(data));
      },

      export: function(filename) {
        if (rootNode.children.length > 0) {

          this.setCurrentNode(rootNode.children[0]);
          var currentZoom = paper.view.zoom;
          var currentPan = paper.view.center.clone();
          paper.view.zoom = this.zeroedZoom;
          paper.view.center = this.zeroedPan.clone();
          this.listenToOnce(this, 'renderComplete', function() {

            var data = paper.project.exportSVG({
              asString: true

            });

            var blob = new Blob([data], {
              type: 'image/svg+xml'
            });
            var fileSaver = new FileSaver(blob, filename);
            paper.view.zoom = currentZoom;
            paper.view.center = currentPan;


            paper.view.draw();

          });
          // this.rootRender();

        }


      },

      load: function(loadObj) {
        //console.log(loadObj);
        rootNode.deleteChildren();
        var children = loadObj.children;
        this.parseJSON(rootNode, children);
        if (rootNode.children.length > 0) {
          this.setCurrentNode(rootNode.children[0]);
        }
        this.rootUpdate();
        //this.rootRender();
        paper.view.draw();
        this.modified = false;
        this.trigger('disableSave', !this.modified);
      },

      loadFile: function(file) {
        var reader = new FileReader();
        reader.parent = this;
        reader.onload = (function(theFile) {

          return function(e) {
            this.parent.load(JSON.parse(e.target.result));
            var id = this.parent.save(theFile.name);
            this.parent.trigger('loadComplete', id, theFile.name);
            paper.view.zoom = this.parent.zeroedZoom;
            paper.view.center = this.parent.zeroedPan.clone();
          };
        })(file);
        reader.readAsText(file);
      },

      parseJSON: function(currentNode, data) {
        console.log('parse json', currentNode, data);
        for (var i = 0; i < data.length; i++) {
          var type = data[i].type;
          var node;
          switch (type) {
            case 'path':
              node = new PathNode(data[i]);
              break;
            case 'polygon':
              node = new PolygonNode(data[i]);
              break;
            default:
              node = new GeometryNode(data[i]);
              break;
          }
          node.type = type;
          node.name = data[i].name;
          currentNode.addChildNode(node);
          for (var j = 0; j < data[i].behaviors.length; j++) {
            var behavior = data[i].behaviors[j];
            this.event_bus.trigger('newBehavior', [node], behavior.name, behavior);
          }

          if (data[i].children.length > 0) {
            this.parseJSON(node, data[i].children);
          }

        }
      },



      updateStroke: function(width) {
        var selectedTool = toolCollection.get(this.get('state'));
        selectedTool.style.strokeWidth = width;
        if (selectTool.selectedNodes.length > 0) {
          for (var i = 0; i < selectTool.selectedNodes.length; i++) {
            selectTool.selectedNodes[i].updateSelected([{
              strokeWidth: Number(width)
            }]);
          }
        }
        currentNode.update([{}]);
        // this.rootRender();
        paper.view.draw();
      },

      updateColor: function(color, type) {
        console.log('color=', color);
        var selectedTool = toolCollection.get(this.get('state'));


        var update;
        if (type == 'stroke') {
          update = [{
            strokeColor: color
          }];


          selectedTool.style.strokeColor = color;
          console.log("set stroke color to:", color);

        } else {
          update = [{
            fillColor: color
          }];
          selectedTool.style.fillColor = color;
          console.log("set fill color to", color);
        }
        console.log(update);

        for (var i = 0; i < selectTool.selectedNodes.length; i++) {

          selectTool.selectedNodes[i].updateSelected(update);
        }

        currentNode.update([{}]);
        //this.rootRender();
        paper.view.draw();
      },

      updateCopyNum: function(number) {
        if (selectTool.selectedNodes.length > 0) {
          this.rootChange(true);

          for (var i = 0; i < selectTool.selectedNodes.length; i++) {

            selectTool.selectedNodes[i].incrementCopyNum(number);
          }
          this.rootChange(false);


        }
        currentNode.update([{}]);
        // this.rootRender();
        paper.view.draw();
      },

      removeBehavior: function(behaviorName) {
        var s = selectTool.selectedNodes[selectTool.selectedNodes.length - 1];
        if (s) {
          this.event_bus.trigger('removeBehavior', s, behaviorName);

        }
      },

      deleteObject: function() {
        if (selectTool.selectedNodes.length > 0) {
          for (var i = 0; i < selectTool.selectedNodes.length; i++) {
            if (!selectTool.selectedNodes[i].isFollowPath) {
              selectTool.selectedNodes[i].deleteNode();
            }
          }
        }
        currentNode.update([{}]);
        // this.rootRender();
        paper.view.draw();
      },

    });

    return StateManagerModel;

  });