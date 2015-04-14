/*StateManagerModel.js
 *model that manages all base shapes*/

define(['jquery',
  'underscore',
  'paper',
  'backbone',
  'backbone.undo',
  'models/data/GeometryNode',
  'models/data/PathNode',
  'models/data/PolygonNode',
  'models/data/RectNode',
  'models/data/EllipseNode',
  'models/data/ListNode',
  'models/data/Instance',
  'models/data/Sampler',
  'models/tools/ToolCollection',
  'models/tools/PolyToolModel',
  'models/tools/SelectToolModel',
  'models/tools/FollowPathToolModel',
  'models/tools/ConstraintToolModel',
  'filesaver',
  'models/data/Visitor',
  'utils/PPoint',
  'utils/ColorUtils',
  'utils/Utils',
  'utils/PaperUIHelper',
], function($, _, paper, Backbone, UndoManager, GeometryNode, PathNode, PolygonNode, RectNode, EllipseNode, ListNode, Instance, Sampler, ToolCollection, PolyToolModel, SelectToolModel, FollowPathToolModel, ConstraintToolModel, FileSaver, Visitor, PPoint, ColorUtils, Utils, PaperUIHelper) {

  var rootNode, uninstantiated, visitor, currentNode, toolCollection, polyTool, selectTool, rotateTool, followPathTool, constraintTool, clutch;

  var currentView, subView, mainView;
  var undoManager;

  var undoLimit = 15;
  var toolNameMap;

  var StateManagerModel = Backbone.Model.extend({


    defaults: {
      'state': 'polyTool',
      'tool-mode': 'standard',
      'tool-modifier': 'none',
      'tool': null
    },

    initialize: function(attributes, options) {

      clutch = 0;
      //setup paperscopes
      var canvas = $('canvas').get(0);
      var subcanvas = $('canvas').get(1);
      paper.setup(canvas);
      paper.setup(subcanvas);
      mainView = paper.View._viewsById['canvas'];
      mainView._project.activate();
      subView = paper.View._viewsById['sub-canvas'];
      currentView = mainView;

      // setup helpers and factories
      PaperUIHelper.setup( this );

      //setup user tool managers

      selectTool = new SelectToolModel({
        id: 'selectTool'
      });
      polyTool = new PolyToolModel({
        id: 'polyTool'
      });
      followPathTool = new FollowPathToolModel({
        id: 'followPathTool'
      });
      constraintTool = new ConstraintToolModel({
        id: 'constraintTool'
      });
      constraintTool.sm = this;

      toolCollection = new ToolCollection([polyTool, selectTool, followPathTool, constraintTool]);

      toolNameMap = {
        'select': selectTool,
        'poly': polyTool,
        'path': followPathTool,
        'constraint': constraintTool
      };

      /* event listener registers */
      this.listenTo(toolCollection, "geometryAdded", this.geometryAdded);
      this.listenTo(toolCollection, "geometrySelected", this.geometrySelected);
      this.listenTo(toolCollection, "geometryDSelected", this.geometryDSelected);
      this.listenTo(toolCollection, "geometryModified", this.geometryModified);
      this.listenTo(toolCollection, "geometrySegmentModified", this.geometrySegmentModified);
      this.listenTo(toolCollection, 'updateProperties', this.updateProperties);
      this.listenTo(toolCollection, "addInstance", this.addInstance);
      this.listenTo(toolCollection, "setPositionForIntialized", this.setPositionForInitialized);
      this.listenTo(toolCollection, 'setState', this.setState);
      this.on('change:tool-mode', this.modeChanged);
      this.on('change:tool-modifier', this.modeChanged);

      // EXPERIMENTAL: Tool Function-call delegation, should be for each tool
      this.listenTo(constraintTool, 'delegateMethod', this.delegateMethod);

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
      paper.view.draw();

    },

    redo: function() {
      undoManager.redo();
      paper.view.draw();


    },

    setState: function(state, mode) {
      this.clearIrrelevantState();
      toolCollection.get(this.get('state')).reset();

      this.set('state', state);
      if (mode) {
        var currentTool = toolCollection.get(this.get('state'));
        currentTool.set('mode', mode);
      }
      if (state === 'polyTool') {
        this.moveToRoot();

      }
    },

    clearIrrelevantState: function() {
      var state = this.get('state');
      switch (state) {
        case 'constraintTool':
          constraintTool.clearState();
          break;
        default:
      }
      this.compile();
    },

    /*
     * Tell the tool to advance its state.
     */
    advanceTool: function() {
      var tool = toolCollection.get(this.get('state'));
      tool.advance();
    },

    resetTools: function() {
      toolCollection.get(this.get('state')).reset();

    },

    getToolByName: function(toolName) {
      return toolNameMap[toolName];
    },

    /*
     * Requests a particular tool to call a named method. The results are passed back to the source of the delegation.
     */
    delegateMethod: function(toolName, methodName) {
      console.log('Delegating method: ' + methodName + ' to tool: ' + toolName);
      var args = Array.prototype.slice.call(arguments, 2); // extract the method arguments
      var tool = this.getToolByName(toolName);
      var method = tool[methodName];
      var result = tool[methodName].apply(tool, args);
      return result;
    },

    /* geometryAdded
     * callback that is triggered when a new geometry
     * object is created by the user
     * creates a static object with no inheritance and adds it
     * to the scene graph
     */
    geometryAdded: function(literal) {
      selectTool.deselectAll();
      var currentTool = toolCollection.get(this.get('state'));

      var matrix = currentTool.get('matrix');

      var pathNode;
      switch (currentTool.get('mode')) {
        case 'poly':
          pathNode = new PolygonNode();
          break;
        case 'ellipse':
          pathNode = new EllipseNode();
          break;
        case 'rect':
          pathNode = new RectNode();
          break;
        case 'pen':
          pathNode = new PathNode();
          break;

      }
      pathNode.normalizeGeometry(literal, matrix);
      selectTool.addSelectedShape(pathNode);

      currentNode.addChildNode(pathNode);
      visitor.addToOpenLists(pathNode);
      currentTool.set('literals', []);
      this.compile();

    },

    /* addInstance
     * adds one instance of the prototype selected to the scenegraph
     * TODO: will be more complex when multiple objects are selected-
     * behavior probably should be to create a prototype which encapsulates
     * all those objects rather than one prototype per object
     */
    addInstance: function( instance, parent ) {
      if ( instance ) {
        if ( parent ) {
          parent.addChildNode( instance );
        } else {
          rootNode.addChildNode( instance );
        }
        this.compile();
      }
      else if (this.get('state') === 'selectTool') {
        var selectedShapes = selectTool.get('selected_shapes');
        if (selectedShapes.length == 1) {
          var instance = selectedShapes[0];
          var newInstance = instance.create();
          currentNode.addChildNode(newInstance);
          visitor.addToOpenLists(newInstance);
          instance.set('selected', false);
          newInstance.set('selected', true);
          selectedShapes[0] = newInstance;
          var id = instance.get('id');
          this.compile();
        }
      }
    },

    /*groupInstance
     * creates list from currently selected instances
     */
    groupInstance: function() {
      if (this.get('state') === 'selectTool') {
        var selectedShapes = selectTool.get('selected_shapes');
        if (selectedShapes.length > 0) {

          var list = new ListNode();
          var sampler = new Sampler();
          sampler.addChildNode(list);
          list.setSampler(sampler);

          list.addMember(selectedShapes);

         
          visitor.addList(list);
          selectTool.deselectAll();
          currentNode.addChildNode(sampler);
          selectTool.addSelectedShape(list);
          var m_d = list.members[0].accessProperty('translation_delta');
          sampler.modifyProperty({translation_delta:m_d});
        }
      }
      this.compile();

    },

    /*openSelectedGroups
     * attempts to open selected items, if they are lists
     * and updates selection accordingly
     */
    openSelectedGroups: function() {
      var selectedShapes = selectTool.get('selected_shapes');
      var members = [];
    
        var openedLists = visitor.toggleOpen(selectedShapes);
        for(var i=0;i<openedLists.length;i++){
          members = members.concat(openedLists[i].members);
        
      }
      selectTool.removeSelectedShape(openedLists);
      selectTool.addSelectedShape(members);
      this.compile();
    },

    /*closeSelectedGroups
     * attempts to close selected items, if they are lists
     * and updates selection accordingly
     */
    closeSelectedGroups: function() {
      var selectedShapes = selectTool.get('selected_shapes');
      var toggledLists = visitor.toggleClosed(selectedShapes);
      selectTool.removeSelectedShape(selectedShapes);
      selectTool.addSelectedShape(toggledLists);
      this.compile();
    },

    setPositionForInitialized: function(position) {
      var selectedShapes = selectTool.get('selected_shapes');
      if (selectedShapes.length == 1) {
        var instance = selectedShapes[0];
        instance.set('position', new PPoint(position.x, position.y));
        instance.set('rotation_origin', new PPoint(position.x, position.y));
        instance.set('scaling_origin', new PPoint(position.x, position.y));
        instance.set('transformation_delta', new PPoint(0, 0));

      }
    },

    animate: function() {
      var selectedShapes = selectTool.get('selected_shapes');
      var property;
      var levels = 1;
      switch (selectTool.get('mode')) {
        case 'select':
          property = 'translation_delta';
          break;
        case 'rotate':
          property = 'rotation_delta';
          break;
        case 'scale':
          property = 'scaling_delta';
          break;
      }
      for (var i = 0; i < selectedShapes.length; i++) {
        selectedShapes[i].animateAlpha(levels, property, this.get('tool-mode'), this.get('tool-modifier'), 0);


      }
      paper.view.draw();

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

        currentNode.addChildNode(newInstance);
        newInstance.set('selected', true);
        instance.set('selected', false);
        selectedShapes[i] = newInstance;
      }
      this.compile();

      for (var j = 0; j < instances.length; j++) {
        this.trigger('prototypeCreated', instances[j]);
      }
    },

    // TESTING
    setConstraintProperty: function(data) {
      var result = constraintTool.setConstraintProperty(data);
      this.trigger('toolViewUpdate', 'constraint', result);
    },

    setConstraintType: function(data) {
      var result = constraintTool.setConstraintType(data);
      this.trigger('toolViewUpdate', 'constraint', result);
    },

    setConstraintExpression: function(data) {
      var result = constraintTool.setConstraintExpression(data);
      this.trigger('toolViewUpdate', 'constraint', result);
    },

    toolViewUpdate: function(view, data) {

    },
    // END TESTING

    /* geometrySelected
     * callback that is triggered when a new geometry
     * object is selected by the user
     */
    geometrySelected: function(literal, constrain) {
      if (literal) {
        var styledata = {
          fill_color: (literal.fillColor) ? literal.fillColor.toCSS(true) : null,
          stroke_color: (literal.strokeColor) ? literal.strokeColor.toCSS(true) : null,
          stroke_width: (literal.strokeWidth) ? literal.strokeWidth : null
        };

        var linstance = literal.data.instance;
        var sInstances = visitor.filterSelection(linstance);
        for (var j = 0; j < sInstances.length; j++) {
          var instance = sInstances[j];
          selectTool.addSelectedShape(instance);
          instance.setSelectionForInheritors(true, this.get('tool-mode'), this.get('tool-modifier'), 1);

          this.setToolStyle(styledata);

          if (selectTool.get('selected_shapes').length === 1) {
            var params = instance.get('userParams');
            var id = instance.get('id');
            this.trigger('geometrySelected', styledata, params, id);
          }

        }
      }

      this.compile();
    },

    /* geometryDSelected
     * callback that is triggered when a new geometry
     * object is direct-selected by the user
     */
    geometryDSelected: function(segments, override) {
      //console.log('triggered');
      if (segments.length > 0) {
        var path = segments[0].path;

        var instance = path.data.instance;
        //console.log('dselected', override);
        if (!instance.get('proto_node') || override) {
          selectTool.addSelectedShape(instance);
          instance.setSelectionForInheritors(true, this.get('tool-mode'), this.get('tool-modifier'), 1);

          var selected_indexes = instance.get('selected_indexes');
          for (var i = 0; i < segments.length; i++) {
            selected_indexes.push(segments[i].index);
          }
        }
      }

      this.compile();

    },

    /*modeChanged
     * event callback triggered when tool mode is altered
     * to update the selection visiualizaitons for the selected shapes to
     * correspond with the new tool mode
     */
    modeChanged: function() {
      //console.log('mode changed');
      var selectedShapes = selectTool.get('selected_shapes');
      for (var i = 0; i < selectedShapes.length; i++) {

        selectedShapes[i].setSelectionForInheritors(true, this.get('tool-mode'), this.get('tool-modifier'), 1);
      }
      this.compile();
    },


    /* geometryParamsModified
     * callback that is triggered when exposed parameters of geometry are
     * modified by the user
     */
    geometryParamsModified: function(data) {
      var selectedShapes = selectTool.get('selected_shapes');
      for (var i = 0; i < selectedShapes.length; i++) {
        selectedShapes[i].updateParams(data);
      }
      this.compile();
    },


    /* geometryModified
     * callback that is triggered when a geometry is transformed
     * by the user.
     */
    geometryModified: function(data, modifiers) {
      var selectedShapes = selectTool.get('selected_shapes');
      for (var i = 0; i < selectedShapes.length; i++) {
        var instance = selectedShapes[i];
        console.log('modifying with data',data);
        instance.modifyProperty(data, this.get('tool-mode'), this.get('tool-modifier'));
      }
      this.compile();
    },


    /*geometryDeleted
    * triggers a delete action on the visitor
    */
    geometryDeleted:function(){
       var selectedShapes = selectTool.get('selected_shapes');
      for (var i = 0; i < selectedShapes.length; i++) {
        console.log('deleting at ',i);
        var instance = selectedShapes[i];
        visitor.removeInstance(rootNode,null,instance);
      }
      selectTool.deselectAll();
      this.compile();
    },

    // TODO: check that this meshes 
    removeInstance: function( instance ) {
      visitor.removeInstance( rootNode, null, instance);
    },

    /* geometrySegmentModified
     * callback that is triggered when a geometry segment is transformed
     * by the user
     */
    geometrySegmentModified: function(data, handle, modifiers) {
      var selectedShapes = selectTool.get('selected_shapes');
      for (var i = 0; i < selectedShapes.length; i++) {
        var instance = selectedShapes[i];
        var selected_indexes = instance.get('selected_indexes');
        for (var j = 0; j < selected_indexes.length; j++) {
          instance.modifyPoints(selected_indexes[j], data, handle, this.get('tool-mode'), this.get('tool-modifier'));
        }
      }
      this.compile();

    },

    /*setToolStyle
     * called to update the style settings for the currently selected tool
     */
    setToolStyle: function(data) {
      var selectedTool = toolCollection.get(this.get('state'));
      var style = selectedTool.get('style');

      if (data.stroke_color) {
        style.stroke_color = data.stroke_color;
      }
      if (data.fill_color) {
        style.fill_color = data.fill_color;
      }
      if (data.stroke_width) {
        style.stroke_width = data.stroke_width.val;
      }
      selectedTool.set('style', style);
    },


    /*styleModified
     * triggered when style properties are modified in the property bar
     * updates the color/ fill/ stroke weight of selected shapes
     */
    styleModified: function(style_data) {
      var selectedShapes = selectTool.get('selected_shapes');

      for (var i = 0; i < selectedShapes.length; i++) {
        var instance = selectedShapes[i];
        instance.modifyProperty(style_data, this.get('tool-mode'), this.get('tool-modifier'));
      }
      this.compile();

    },

    /* compile
     * resets the geometry functions
     * to remove all active instances and then
     * visits the root node to
     * begin the rendering process
     */
    compile: function() {

      //mainView._project.clear();
      // subView._project.clear();
      visitor.resetPrototypes(rootNode.children);
      visitor.compileInstances(rootNode);
      visitor.compileLists();
      visitor.render(rootNode);

      //used to switch canvas, not currently being used
      //currentView._project.activate();
      //console.log('paper shapes',mainView._project.activeLayer.children.length);
      mainView.draw();

    },

    /*toggleView
     * changes the currently active view
     * not currently in use
     */
    toggleView: function(main) {
      selectTool.deselectAll();


      if (main) {
        currentView = mainView;
      } else {
        currentView = subView;

      }

      this.compile();

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

    //triggered by paper tool on a mouse down event
    toolMouseDown: function(event, pan) {
      if (!event.modifiers.space && Utils.validateEvent(event)) {
        var selectedTool = toolCollection.get(this.get('state'));
        selectedTool.mouseDown(event);
      }
    },

    toolMouseUp: function(event, pan) {
      var selectedTool = toolCollection.get(this.get('state'));

      if (!event.modifiers.space && Utils.validateEvent(event)) {
        selectedTool.mouseUp(event);
      }
      if (selectedTool.get('mode') !== 'pen') {
        this.compile();
      }
    },


    toolMouseDrag: function(event) {
      if (!event.modifiers.space && Utils.validateEvent(event)) {
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
      if (!event.modifers.space && Utils.validateEvent(event)) {
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


        if (data[i].children.length > 0) {
          this.parseJSON(node, data[i].children);
        }

      }
    }
  
  });

  return StateManagerModel;

});
