/*StateManagerModel.js
 *model that manages all base shapes*/

define([
    'jquery',
    'underscore',
    'paper',
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
    'models/tools/FollowPathToolModel',
    'filesaver',
    'models/behaviors/actions/BlockNode',
    'models/behaviors/actions/InitializeNode',
    'models/behaviors/actions/TranslateNode',
    'models/behaviors/actions/RotateNode',
    'models/data/Visitor',
    'models/data/Edge',
    'utils/PPoint'


  ],

  function($, _, paper, Backbone, UndoManager, GeometryNode, PathNode, PolygonNode, Instance, ToolCollection, PenToolModel, PolyToolModel, SelectToolModel, FollowPathToolModel, FileSaver, BlockNode, InitializeNode, TranslateNode, RotateNode, Visitor, Edge, PPoint) {
    var rootNode,
      uninstantiated,
      visitor,
      shownPrototype,
      currentNode,
      toolCollection,
      penTool,
      polyTool,
      selectTool,
      rotateTool,
      followPathTool,
      clutch;

    var currentView, subView, mainView;
    var undoManager;

    var undoLimit = 15;


    var StateManagerModel = Backbone.Model.extend({

      defaults: {
        'state': 'polyTool',
      },

      initialize: function(event_bus) {
        clutch = 0;
        this.event_bus = event_bus;

        //setup paperscopes
        var canvas = $('canvas').get(0);
        var subcanvas = $('canvas').get(1);
        paper.setup(canvas);
        paper.setup(subcanvas);
        mainView = paper.View._viewsById['canvas'];
        mainView._project.activate();
        subView = paper.View._viewsById['sub-canvas'];


        currentView = mainView;
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
        followPathTool = new FollowPathToolModel({
          id: 'followPathTool'

        });
        followPathTool.event_bus = event_bus;
        toolCollection = new ToolCollection([polyTool, penTool, selectTool, followPathTool]);


        /* event listener registers */
        this.listenTo(toolCollection, "geometryAdded", this.geometryAdded);
        this.listenTo(toolCollection, "geometrySelected", this.geometrySelected);
        this.listenTo(toolCollection, "geometryIncremented", this.geometryIncremented);
        this.listenTo(toolCollection, "geometryCopied", this.geometryCopied);
        this.listenTo(toolCollection, "geometryDeepCopied", this.geometryDeepCopied);
        this.listenTo(toolCollection, "modifyInheritance", this.modifyInheritance);


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
        rootNode.set('name', 'root');
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

      setState: function(state, mode) {
        toolCollection.get(this.get('state')).reset();

        this.set('state', state);
        if (mode) {
          var currentTool = toolCollection.get(this.get('state'));
          currentTool.set('mode', mode);
        }
        if (state === 'penTool' || state === 'polyTool') {
          this.moveToRoot();

        }

      },



      resetTools: function() {
        toolCollection.get(this.get('state')).reset();

      },

      /* geometryAdded
       * callback that is triggered when a new geometry
       * object is created by the user
       * creates a static object with no inheritance and adds it
       * to the scene graph
       */
      geometryAdded: function(event) {
        selectTool.deselectAll();
        var currentTool = toolCollection.get(this.get('state'));
        var paperObjects = currentTool.get('literals');
        var matrix = currentTool.get('matrix');
        for (var i = 0; i < paperObjects.length; i++) {
          var pathNode = new PolygonNode();
          var data = pathNode.normalizePath(paperObjects[i], matrix);
          selectTool.addSelectedShape(pathNode);
          pathNode.update(data);
          var edge = new Edge({
            x: currentNode,
            y: pathNode
          });
          currentNode.addChildNode(pathNode);
          pathNode.addEdge(edge);
        }
        currentTool.set('literals', []);
        this.compile();

      },

      /* addPrototype
       * converts a static object to a prototype
       * and adds one instance of the prototype to the scenegraph
       * TODO: will be more complex when multiple objects are selected-
       * behavior probably should be to create a prototype which encapsulates
       * all those objects rather than one prototype per object
       */

      addPrototype: function() {
        if (this.get('state') === 'selectTool') {
          var selectedShapes = selectTool.get('selected_shapes');
          if (selectedShapes.length == 1) {
            var instance = selectedShapes[0];
            instance.set('translation_delta', new PPoint(0, 0));

            var sceneParent = instance.nodeParent;
            var newInstance = this.create(instance);
            newInstance.set('position', instance.get('position').clone());
            newInstance.set('rotation_origin', instance.get('position').clone());
            newInstance.set('scaling_origin', instance.get('position').clone());

            var edge = new Edge({
              x: sceneParent,
              y: newInstance,
            });

            edge.addAll();
            sceneParent.removeChildNode(instance);
            sceneParent.addChildNode(newInstance);
            newInstance.addEdge(edge);
            instance.set('selected', false);
            newInstance.set('selected', true);

            instance.set('isProto', true);
            visitor.addPrototype(instance);
            selectedShapes[0] = newInstance;
            var id = instance.get('id');
            if (shownPrototype) {
              shownPrototype.set('show', false);
            }
            shownPrototype = instance;
            shownPrototype.set('show', true);
            this.compile();
            var geom = instance.get('geom').clone();

            return {
              geom: geom,
              id: id
            };
          } else {
            return false;
          }
        } else {
          return false;
        }
      },

      /*showPrototype
       * called to show a new prototype in the sub canvas
       */
      showPrototype: function(prototype) {
        if (shownPrototype) {
          shownPrototype.set('show', false);
        }
        if (prototype) {
          console.log("revealing prototype", prototype.get('geom').position);
          shownPrototype = prototype;
          shownPrototype.set('show', true);
          this.compile();
          this.trigger('centerGeom', prototype.get('geom').position);
        } else {
          shownPrototype = null;
        }
      },


      /* geometryInstantiated
       * callback that is triggered when a geometry
       * object is instantiated from a prototype
       */
      geometryInstantiated: function(x, y) {
       
        if (shownPrototype && currentView!= subView) {
          var newInstance = this.create(shownPrototype);

          var screenpos = shownPrototype.get('geom').position;
          var protopos = shownPrototype.get('position');
          var td = new PPoint(x - screenpos.x + protopos.x, y - screenpos.y + protopos.y);

          newInstance.set('position', td.clone());
          newInstance.set('rotation_origin', td.clone());
          newInstance.set('scaling_origin', td.clone());

          //var td = prototype.get('position').clone();
          //newInstance.set('translation_delta', instance.get('position').clone());
          var edge = new Edge({
            x: currentNode,
            y: newInstance,
          });

          edge.addAll();
          newInstance.addEdge(edge);
          currentNode.addChildNode(newInstance);
          newInstance.set('selected', true);
          selectTool.addSelectedShape(newInstance);
          this.compile();
          return true;
        }
        return false;
      },

      /* create
       * Prototypal inheritance action:
       * creates a new instance which inherits from
       * the parent instance.
       * TODO: add in checks to prevent diamond inheritance
       */
      create: function(parent) {
        var instance = new Instance();
        instance.set('proto_node', parent);
        instance.set('rotation_node', parent);
        instance.set('scaling_node', parent);
        instance.set('translation_node', parent);

        var inheritors = parent.get('inheritors');
        inheritors.push(instance);
        parent.set('inheritors', inheritors);
        return instance;
      },

      /*geometryDeepCopied
       * makes an independent clone of the object being copied and
       * transfers selection to that object
       * TODO: deep copy all descendants of copy
       * look into dynamically re-assigining prototype
       */
      geometryDeepCopied: function(event) {
        var instances = [];
        var selectedShapes = selectTool.get('selected_shapes');
        for (var i = selectedShapes.length - 1; i >= 0; i--) {

          var instance = selectedShapes[i];
          var newInstance = new PolygonNode();
          instance.copyAttributes(newInstance);
          var geom = instance.inheritGeom().clone();

          geom.fillColor = 'red';
          newInstance.set('master_path', geom);
          visitor.addGeomFunction(newInstance);
          instances.push(newInstance);

          var edge = new Edge({
            x: currentNode,
            y: newInstance
          });

          currentNode.addChildNode(newInstance);
          newInstance.addEdge(edge);
          newInstance.set('selected', true);
          instance.set('selected', false);
          selectedShapes[i] = newInstance;
        }
        this.compile();

        for (var j = 0; j < instances.length; j++) {
          this.trigger('prototypeCreated', instances[j]);
        }
      },

      /* geometrySelected
       * callback that is triggered when a new geometry
       * object is selected by the user
       */
      geometrySelected: function(event) {
        var currentTool = toolCollection.get(this.get('state'));
        var paperObjects = currentTool.get('literals');
        for (var i = 0; i < paperObjects.length; i++) {
          var paperObject = paperObjects[i];
          var instance = paperObject.data.instance;
          /*instance.getLinkedDimensions({
            top: true
          });*/
          selectTool.addSelectedShape(instance);

        }
        //show prototype in sub view if selecting objects in the main view
        if (currentView != subView) {
          var lastSelected = selectTool.getLastSelected();
          if (lastSelected) {
            console.log("found last selected");
            var proto = lastSelected.get('proto_node');
            console.log("found prototype", proto);
            this.showPrototype(proto);
          }
        }

        this.compile();
      },

      modifyInheritance: function(event, type) {
        var selectedShapes = selectTool.get('selected_shapes');
        var protoTarget = selectedShapes[selectedShapes.length - 1];
        var instance = selectedShapes[selectedShapes.length - 2];
        instance.set('rotation_node', protoTarget);
        var inheritors = protoTarget.get('inheritors');
        inheritors.push(instance);
        protoTarget.set('inheritors', inheritors);

        var edge = new Edge({
          x: protoTarget,
          y: instance,
        });

        if ((instance.has('rotation_node')) && (instance.has('proto_node'))) {
          var rotationNode = instance.get('rotation_node');
          var protoNode = instance.get('proto_node');
          if (rotationNode != protoNode) {
            var rLevel = rotationNode.getLevelInTree();
            var pLevel = protoNode.getLevelInTree();
            var rIndex = rotationNode.getIndex();
            var pIndex = protoNode.getIndex();


            if (rLevel > pLevel) {
              var remove = protoNode.removeChildNode(instance);
              if (remove) {
                rotationNode.addChildNode(instance);
              }
            } else if (rLevel < pLevel) {
              var remove = rotationNode.removeChildNode(instance);
              if (remove) {
                protoNode.addChildNode(instance);
              }
            } else {
              if (rIndex > pIndex) {
                var remove = protoNode.removeChildNode(instance);
                if (remove) {
                  rotationNode.addChildNode(instance);
                }
              } else if (rIndex < pLevel) {
                var remove = rotationNode.removeChildNode(instance);
                if (remove) {
                  protoNode.addChildNode(instance);
                }
              }
            }
          }
        }
      },


      /* geometryIncremented
       * callback that is triggered when a geometry is transformed
       * by the user. Iterates through currently selected shapes
       * and updates their deltas based on the transformation
       * compiles graph and then iterates through a second time
       * to display bounding boxes
       * TODO: design so that only one iteration is neccesary?
       */
      geometryIncremented: function(data, override, segment_index) {
        var selectedShapes = selectTool.get('selected_shapes');
        for (var i = 0; i < selectedShapes.length; i++) {
          var instance = selectedShapes[i];
          if (segment_index != null) {

            var rmatrix = instance.get('rmatrix');
            var tmatrix = instance.get('tmatrix');
            var smatrix = instance.get('smatrix');
            instance.updateGeom(segment_index, data, rmatrix, smatrix, tmatrix);

          } else {
            instance.incrementDelta(data, override);
            //console.log("incremented id=",instance.get('id'));

          }
          if (override) {
            var prototypes = instance.getRelevantPrototypes(data);
            for (var j = 0; j < prototypes.length; j++) {
              var id = prototypes[j].get('id');
              var geom = prototypes[j].get('geom').clone();
              this.trigger('protoypeViewModified', geom, id, true);
            }
          }

        }
        this.compile();

        for (var k = 0; k < selectedShapes.length; k++) {
          var inst = selectedShapes[k];
          /*inst.getLinkedDimensions({
            top: true,
            mode: selectTool.get('mode')
          });*/
        }
      },

      /* compile
       * resets the geometry functions
       * to remove all active instances and then
       * visits the root node to
       * begin the rendering process
       */
      compile: function() {

        mainView._project.clear();
        subView._project.clear();

        visitor.resetPrototypes();
        visitor.resetPrototypes(rootNode.children);
        visitor.visit(rootNode, null);

        currentView._project.activate();

        mainView.draw();
        subView.draw();

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
        var selectedNodes = toolCollection.get(this.get('state')).selectedNodes;
        this.trigger('pathSelected', selectedNodes[selectedNodes.length - 1]);

      },


      getSelection: function() {

        toolCollection.get(this.get('state')).selectedNodes = selectTool.selectedNodes;


      },

      /*toggleView
       * changes the currently active view
       */
      toggleView: function(main) {
        selectTool.deselectAll();


        if (main) {
          currentView = mainView;
          console.log("setting active to main");
        } else {
          currentView = subView;
          console.log("setting active to sub");

        }

        this.compile();

      },


      //=======================END SELECTION METHODS=======================//

      moveUpNode: function() {
        this.setCurrentNode(currentNode);

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

      },

      //callback triggered when tool navigates to specific node in tree;
      setCurrentNode: function(node) {

        if (node.getParentNode() !== null) {
          currentNode = node.getParentNode();
        } else {

        }
      },

      /*recursively follows parent hierarchy upwards to find correct selection point 
       * when selected node is found, it is assigned as the currently selected
       * node in the selected tool.
       * TODO: make this assignment less janky.
       */
      determineSelectionPoint: function(selected) {
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
        if (!event.modifiers.space) {
          var selectedTool = toolCollection.get(this.get('state'));
          selectedTool.mouseDown(event);
          if (this.get('state') === 'penTool') {
            this.modified = true;
            this.trigger('disableSave', !this.modified);
          }
        }


      },

      toolMouseUp: function(event, pan) {
        if (!event.modifiers.space) {
          var selectedTool = toolCollection.get(this.get('state'));
          selectedTool.mouseUp(event);
        }

      },


      toolMouseDrag: function(event) {
        if (!event.modifiers.space) {
          var selectedTool = toolCollection.get(this.get('state'));
          selectedTool.mouseDrag(event);
        }

      },

      canvasMouseDrag: function(delta, pan) {
        if (pan) {
          var inverseDelta = new paper.Point(-delta.x / paper.view.zoom, -delta.y / paper.view.zoom);
          paper.view.scrollBy(inverseDelta);

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



      toolMouseMove: function(event) {
        if (!event.modifers.space) {
          var selectedTool = toolCollection.get(this.get('state'));
          selectedTool.mouseMove(event);
        }


      },

      canvasMouseWheel: function(event, pan, modify) {
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
        // var selectedTool = toolCollection.get(this.get('state'));
        //selectedTool.dblClick(event);


      },

      //called when escape key is pressed in canvas
      escapeEvent: function() {

      },

      saveFile: function(id, filename) {
        if (this.modified) {
          id = this.save(filename);
        }
        var data = localStorage[id];
        var blob = new Blob([data], {
          type: 'text/plain;charset=utf-8'
        });
        var fileSaver = new FileSaver(blob, filename);
        return id;
      },

      save: function() {

        var id = Date.now();
        var data = JSON.stringify(rootNode.exportJSON());

        this.saveToLocal(id, data);

        this.trigger('localSaveComplete', id);
        this.modified = false;
        this.trigger('disableSave', !this.modified);
        return id;
      },

      saveToLocal: function(id, data) {
        var saved = false;
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

          this.trigger('removeItem', arr[0]);
          localStorage.removeItem(arr[0]);

          //}
        }
        localStorage.setItem(id, data);
        saved = true;
      },


      loadLocal: function(filename) {

        var data = localStorage[filename];
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
        var selectedTool = toolCollection.get(this.get('state'));


        var update;
        if (type == 'stroke') {
          update = [{
            strokeColor: color
          }];


          selectedTool.style.strokeColor = color;

        } else {
          update = [{
            fillColor: color
          }];
          selectedTool.style.fillColor = color;
        }

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