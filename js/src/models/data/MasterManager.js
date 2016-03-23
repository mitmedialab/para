/*MasterManager.js
 * manager for all subtype managers (FunctionManager, ListManager, ConstraintManager)
 * stores and manages selected objects
 */

define([
	'underscore',
	'paper',
	'backbone',
	'models/data/Instance',
	'models/data/geometry/Group',
	'models/data/geometry/PathNode',
	'models/data/geometry/SVGNode',
	'models/data/geometry/RectNode',
	'models/data/geometry/EllipseNode',
	'models/data/geometry/PolygonNode',
	'models/data/functions/FunctionNode',
	'models/data/functions/FunctionManager',
	'models/data/collections/CollectionManager',
	'models/data/collections/Duplicator',
	'models/data/Constraint',
	'models/data/collections/ConstrainableList',
	'views/LayersView',
	'views/CollectionView',
	'views/MapView',
	'views/SaveExportView',
	'utils/analytics',
	'utils/GeometryGenerator',
	'models/data/ConstraintManager'



], function(_, paper, Backbone, Instance, Group, PathNode, SVGNode, RectNode, EllipseNode, PolygonNode, FunctionNode, FunctionManager, CollectionManager, Duplicator, Constraint, ConstrainableList, LayersView, CollectionView, MapView, SaveExportView, analytics, GeometryGenerator, ConstraintManager) {
	//debug vars for testing framerate
	var fps = 0,
		now, lastUpdate = (new Date()) * 1;
	var fpsFilter = 10;

	//stores para lists
	var eventType = 'state_manager';
	var store = 0;
	var remove = 2;
	var visit = 3;
	var search = 4;
	var rootNode, currentNode, layersView, collectionView, mapView, functionManager, collectionManager, selected, currentSelectionIndex, constraintManager;
	var constraintMode = false;
	var constraintPropMap = {
		'position': 'translationDelta',
		'scale': 'scalingDelta',
		'rotation': 'rotationDelta',
		'fill': 'fillColor',
		'stroke': 'strokeColor'
	};
	var undoStack = [];
	var redoStack = [];
	var stateStored = false;
	var undo_limit;

	var MasterManager = Backbone.Model.extend({
		defaults: {},

		initialize: function() {
			//setup root node
			//

			rootNode = new FunctionNode({}, {
				geometryGenerator: GeometryGenerator
			});


			rootNode.open();
			undo_limit = rootNode.get('undo_limit');
			selected = rootNode.selected;
			rootNode.set('name', 'root');
			currentNode = rootNode;
			functionManager = new FunctionManager();
			functionManager.selected = selected;

			constraintManager = new ConstraintManager();

			collectionManager = new CollectionManager();
			collectionManager.setLists(rootNode.lists);


			collectionView = new CollectionView({
				el: '#collectionToolbar',
				model: this
			});
			layersView = new LayersView({
				el: '#layers-constraints-container',
				model: this
			});

			SaveExportView = new SaveExportView({
				el: '#save-export-container',
				model: this
			});

			mapView = new MapView({
				model: this
			});

			this.listenTo(collectionManager, 'addToRender', this.addToRenderQueue);
			this.listenTo(collectionManager, 'listLengthChange', this.updateListConstraints);
			this.listenTo(collectionManager, 'duplicatorCountModified', this.duplicatorCountModified);

			var self = this;
			var interval = setInterval(function() {
				self.calculateFPS();
			}, 17);


			paper.view.onFrame = function() {
				self.clearRenderQueue();
			};


		},

		addToUndoStack: function(selected) {
			if (!stateStored) {
				var selected_ids = [];
				for (var i = 0; i < selected.length; i++) {
					if (selected[i].get('type') == 'collection') {
						var geom = selected[i].getAllMembers();
						geom.forEach(function(g) {
							selected_ids.push(g.get('id'));
						});

					}
					selected_ids.push(selected[i].get('id'));
				}
				undoStack.push(selected_ids);
				while (undoStack.length > undo_limit) {
					var self = this;
					console.log('cutting undo stack');
					var shifted = undoStack.shift();
					shifted.forEach(function(id) {
						var item = self.getById(id);
						item.trimUndoStack();

					});

				}
				stateStored = true;
				redoStack = [];

			}
		},

		undo: function(event) {

			if (undoStack.length > 0) {

				var toUndo = undoStack.pop();

				var self = this;
				toUndo.forEach(function(id) {
					var item;
					var toRemove = [];
					var toAdd = [];
					item = self.getById(id);
					var changed = item.undo(self);
					if (changed) {
						toRemove.push.apply(toRemove, changed.toRemove);
						toAdd.push.apply(toAdd, changed.toAdd);
						self.cleanUp(toRemove, toAdd);

					}
				});

				this.deselectAllShapes();

				redoStack.push(toUndo.reverse());
				while (redoStack.length > undo_limit) {
					console.log('cutting undo stack');
					var shifted = redoStack.shift();
					shifted.forEach(function(id) {
						var item = self.getById(id);
						item.trimRedoStack();

					});

				}
			}
		},

		redo: function() {

			if (redoStack.length > 0) {

				var toRedo = redoStack.pop();

				var self = this;
				toRedo.forEach(function(id) {
					var item;
					var toRemove = [];
					var toAdd = [];
					item = self.getById(id);
					var changed = item.redo(self);
					if (changed) {
						toRemove.push.apply(toRemove, changed.toRemove);
						toAdd.push.apply(toAdd, changed.toAdd);
						self.cleanUp(toRemove, toAdd);
					}


				});

				this.deselectAllShapes();

				undoStack.push(toRedo.reverse());
				while (undoStack.length > undo_limit) {
					console.log('cutting undo stack');
					var shifted = undoStack.shift();
					shifted.forEach(function(id) {
						var item = self.getById(id);
						item.trimUndoStack();

					});

				}
			}
		},

		clearUndoCache: function() {
			this.undoStack = [];
			this.redoStack = [];
			this.stateStored = false;
		},

		cleanUp: function(toRemove, toAdd) {
			for (var i = 0; i < toRemove.length; i++) {
				if (toRemove[i].get('type') == 'collection') {
					this.removeListener(toRemove[i]);
					layersView.removeCollection(toRemove[i].get('id'));
				}
				if (toRemove[i].get('type') == 'constraint') {
					layersView.removeConstraint(toRemove[i].get('id'));

				}
				if (toRemove[i].get('type') == 'geometry') {
					layersView.removeShape(toRemove[i].get('id'));

				}

			}
			for (var j = 0; j < toAdd.length; j++) {
				if (toAdd[j].get('type') == 'collection') {
					this.addListener(toAdd[j]);
					layersView.addList(toAdd[j].toJSON());

				}
				if (toAdd[j].get('type') == 'constraint') {
					layersView.addConstraint(toAdd[j]);

				}
				if (toAdd[j].get('type') == 'geometry') {
					layersView.addShape(toAdd[j].toJSON());

				}
			}
		},

		//debgging function
		calculateFPS: function() {
			var thisFrameFPS = 1000 / ((now = new Date()) - lastUpdate);
			if (now != lastUpdate) {
				fps += (thisFrameFPS - fps) / fpsFilter;
				lastUpdate = now;
			}
			if (isNaN(fps)) {
				fps = 1;
			}
			$('#fps').val(Math.round(fps).toString());
			var items = paper.project.getItems({
				class: paper.Path
			});
			var visible = paper.project.getItems({
				class: paper.Path,
				visible: function(visible) {
					return visible;
				}
			});
			$('#papernum').val(items.length);
			$('#visiblenum').val(visible.length);
		},


		importProjectJSON: function(json) {
			analytics.log(eventType, {
				type: eventType,
				id: 'import',
				action: 'importJSON'
			});

			this.deleteAll();

			paper.view.draw();
			console.log('number of paper instances', paper.project.layers[0].children.length, paper.project.layers[1]);
			//paper.project.layers[1].removeChildren();

			var geomChanged = rootNode.parseJSON(json.geometry, this);
			var listChanged = collectionManager.parseJSON(json.lists, this);
			var constraintChanged = constraintManager.parseJSON(json.constraints, this);
			this.cleanUp(geomChanged.toRemove, geomChanged.toAdd);
			this.cleanUp(listChanged.toRemove, listChanged.toAdd);
			this.cleanUp(constraintChanged.toRemove, constraintChanged.toAdd);
		},

		exportProjectJSON: function(json) {

			var geometry_json = rootNode.toJSON(true);
			var constraint_json = constraintManager.toJSON(true);
			var list_json = collectionManager.toJSON(true);
			var project_json = {
				geometry: geometry_json,
				constraints: constraint_json,
				lists: list_json
			};
			return project_json;
		},


		deleteAll: function() {
			this.clearUndoCache();

			var constraintChanged = constraintManager.deleteAll();
			var listChanged = collectionManager.deleteAll();
			var geomChanged = rootNode.deleteAll();
			this.cleanUp(geomChanged.toRemove, geomChanged.toAdd);
			this.cleanUp(listChanged.toRemove, listChanged.toAdd);
			this.cleanUp(constraintChanged.toRemove, constraintChanged.toAdd);
		},



		importSVG: function(data) {
			analytics.log(eventType, {
				type: eventType,
				id: 'import',
				action: 'importSVG'
			});
			var start_item = new paper.Group();
			var item = start_item.importSVG(data); //,{expandShapes:true,applyMatrix:true});
			var path, pathMatrix;
			if (item.children) {
				var children = item.removeChildren();
				paper.project.activeLayer.addChildren(children);
				var new_children = [];
				for (var i = 0; i < children.length; i++) {
					if (children[i].children) {
						path = new SVGNode();
					} else {
						path = new PathNode();
					}
					pathMatrix = new paper.Matrix();
					pathMatrix.translate(children[i].bounds.center.x, children[i].bounds.center.y);
					path.normalizeGeometry(children[i], pathMatrix);
					this.addShape(path, true);
					new_children.push(path);

				}

			} else {
				path = new PathNode();
				pathMatrix = new paper.Matrix();
				pathMatrix.translate(item.bounds.center.x, item.bounds.center.y);
				path.normalizeGeometry(item, pathMatrix);
				this.addShape(path, true);
			}

		},

		exportSVG: function() {
			analytics.log(eventType, {
				type: eventType,
				id: 'export',
				action: 'exportSVG'
			});
			var svg_string = '<svg x="0" y="0" width="1280" height="355" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">';
			var children = rootNode.children;
			for (var i = 0; i < children.length; i++) {
				svg_string += children[i].exportSVG();
			}
			svg_string += '</svg>';
			return svg_string;
		},



		getById: function(id) {
			if (id == "constraint_manager") {
				return constraintManager;
			} else if (id == "collection_manager") {
				return collectionManager;
			} else {
				var prefix = id.split('_')[0];
				var obj;
				switch (prefix) {
					case 'collection':
						obj = collectionManager.getCollectionById(id);
						break;
					case 'internalcollection':
						obj = this.getInternalList(id);
						break;
					case 'constraint':
						obj = this.getConstraintById(id);
						break;
					default:
						obj = this._getGeomById(id);
						break;
				}
				return obj;
			}
		},

		getInternalList: function(id) {
			var list;
			for (var i = 0; i < rootNode.children.length; i++) {
				list = rootNode.children[i].getInternalList(id);
				if (list) {
					return list;
				}
			}
		},

		getInternalListOwner: function(id) {
			var owner;
			for (var i = 0; i < rootNode.children.length; i++) {
				owner = rootNode.children[i].getInternalListOwner(id);
				if (owner) {
					return owner;
				}
			}
		},

		/* getGeomById 
		 * returns prototype by id
		 */
		_getGeomById: function(id, start) {
			var state_data = {
				list: search,
				instance: search,
				func: search,
				data: id
			};

			var match;
			var startNode = rootNode;
			if (start) {
				startNode = start;
			}
			match = this.visit(startNode, null, state_data);
			return match;
		},

		//TODO: move to constraint manager
		getConstraintById: function(id) {
			return constraintManager.getConstraintById(id);
		},

		getConstraintsByRelative: function(relative) {
			return constraintManager.getConstraintsByRelative(relative);
		},

		getConstraintsByReference: function(reference) {
			return constraintManager.getConstraintsByReference(reference);
		},

		constraintModeChanged: function(active) {
			constraintMode = active;
			if (constraintMode) {
				collectionView.disableAll();
			} else {
				collectionView.toggleCollectionButtons(selected);
			}
			this.visualizeConstraint();
		},

		//TODO: move to constraint manager
		visualizeConstraint: function(ref, rel, pref, prel) {
			var ref_i, rel_i;
			if (pref && prel) {
				var pref_i = this.getById(pref);
				var prel_i = this.getById(prel);
				pref_i.get('constraintSelected').setValue(false);
				prel_i.get('constraintSelected').setValue(false);

			}
			if (ref && rel) {
				ref_i = this.getById(ref);
				rel_i = this.getById(rel);
				ref_i.get('constraintSelected').setValue('reference_selected');
				rel_i.get('constraintSelected').setValue('relative_selected');

			} else {
				if (layersView.getCurrentRef() && layersView.getCurrentRel()) {
					ref_i = this.getById(layersView.getCurrentRef());
					rel_i = this.getById(layersView.getCurrentRel());
					if (ref_i) {
						ref_i.get('constraintSelected').setValue(false);
					}
					if (rel_i) {
						rel_i.get('constraintSelected').setValue(false);
					}
					layersView.deactivateConstraint();
					mapView.deactivate();
				}
			}
		},

		modified: function(target) {
			if (target.get('type') == 'collection') {
				target.reset();
				target.compile();
				target.render();
			} else {
				var t = target;

				while (t.nodeParent.get('name') != 'root' && t.nodeParent.nodeParent) {
					t = t.nodeParent;
				}
				t.reset();
				t.compile();
				t.render();
			}
			this.trigger('modified');

		},

		clearRenderQueue: function() {
			currentNode.clearRenderQueue();
			//this.calculateFPS();
		},


		addListener: function(target, recurse) {
			//console.log('adding listener to target',target,target.get('name'));
			this.stopListening(target);
			this.listenTo(target, 'modified', this.modified);
			if (recurse) {
				for (var i = 0; i < target.children.length; i++) {
					this.addListener(target.members[i], recurse);
				}
			}

		},

		removeListener: function(target, recurse) {
			this.stopListening(target);
			if (recurse) {
				for (var i = 0; i < target.children.length; i++) {
					if (target.children[i]) {
						this.removeListener(target.children[i], recurse);
					}
				}
			}

		},


		addObject: function(object, geom) {
			analytics.log(eventType, {
				type: eventType,
				id: 'add',
				action: 'add' + object
			});
			var added;
			switch (object) {
				case 'geometry':
					added = this.addShape(geom, true);
					break;
				case 'copy':
					added = this.addCopy(selected, true);
					break;
				case 'list':
					added = this.addList(selected, true);
					break;
				case 'group':
					added = this.addGroup(selected, true);
					break;
				case 'duplicator':
					if (selected[0]) {
						added = this.initializeDuplicator(selected[0], true);

					}
					break;
			}


			this.trigger('modified');

		},



		removeObjectById: function(id) {

			var object = this.getById(id);
			analytics.log(eventType, {
				type: eventType,
				id: 'remove',
				action: 'remove' + object.get('type')
			});
			switch (object.get('type')) {
				case 'geometry':
					this.removeGeometry(object, true);
					break;
				case 'function':
					//functionManager.removeFunction(selected[i]);
					break;
				case 'collection':
					this.removeCollection(object, true);
					break;
				case 'constraint':
					this.removeConstraint(id, true);
					break;
			}
		},

		removeObject: function() {
			for (var i = 0; i < selected.length; i++) {
				collectionManager.removeObjectFromLists(selected[i]);
				switch (selected[i].get('type')) {
					case 'geometry':
						this.removeGeometry(selected[i], true);
						break;
					case 'function':
						//functionManager.removeFunction(selected[i]);
						break;
						//TODO: this replicates functionality in the ungroup function, should this function differently?
					case 'collection':
						this.removeCollection(selected[i], true);
						break;
				}
				this.stopListening(selected[i]);

			}


		},

		removeGeometry: function(target, registerUndo) {
			var undoQueue = [];
			var constraints = constraintManager.removeConstraintsOn(target, registerUndo);
			if (constraints) {
				undoQueue.push(constraintManager);
				constraints.forEach(function(constraint) {
					layersView.removeConstraint(constraint.get('id'));
				});
			}
			var parent = target.getParentNode();

			undoQueue.unshift(parent);
			parent.removeChildNode(target, registerUndo);
			if (registerUndo) {
				this.addToUndoStack(undoQueue);
				this.modificationEnded(undoQueue);
			}


			layersView.removeShape(target.get('id'));

			target.deleteSelf();
		},

		removeCollection: function(target, registerUndo) {
			var undoQueue = [];
			var constraints = constraintManager.removeConstraintsOn(target, registerUndo);
			if (constraints) {
				undoQueue.push(constraintManager);
				constraints.forEach(function(constraint) {
					layersView.removeConstraint(constraint.get('id'));
				});
			}
			var removedItems;
			layersView.removeCollection(target.get('id'));

			removedItems = collectionManager.removeCollection(target, registerUndo);
			undoQueue.unshift(collectionManager);
			if (registerUndo) {
				this.addToUndoStack(undoQueue);
				this.modificationEnded(undoQueue);
			}
			this.deselectAllShapes();
			this.selectShape(removedItems);
		},

		/*visit
		 * visitor method to walk the tree and compute and render each
		 * node on the screen daccording to type;
		 */
		visit: function(node, departureNode, state_data) {
			node.set({
				visited: true
			});
			switch (node.get('type')) {
				case 'function':
					return this.visitFunction(node, departureNode, state_data);

				default:
					return this.visitInstance(node, departureNode, state_data);

			}

		},


		/* visitFunction
		 * called for visit to function node- TODO: move to function manager
		 */
		visitFunction: function(node, departureNode, state_data) {
			var state = state_data.func;
			var children = node.children;

			switch (state) {
				case search:
					if (node.get('id') == state_data.data) {
						return node;
					} else {
						for (var j = 0; j < children.length; j++) {
							var match = children[j].visit(this, 'visit', node, state_data);
							if (match) {
								return match;
							}
						}
					}
					break;
			}
		},
		/* visitInstance
		 * called for visit to instance node TODO: move to geometry Manager
		 */
		visitInstance: function(node, departureNode, state_data) {
			var state = state_data.instance;
			var children = node.children;
			switch (state) {
				case search:
					if (node.get('id') === state_data.data) {
						return node;
					} else {
						for (var j = 0; j < children.length; j++) {
							var match = children[j].visit(this, 'visit', node, state_data);
							if (match) {
								return match;
							}
						}
					}
					break;
			}
		},


		//=======function managment methods==========//
		//need to put something in here where you can't have an item in a function that is also in an opened list?
		//TODO: MOVE TO FUNCTION MANAGER
		addFunction: function(lists) {
			lists = lists.filter(function(item) {
				return selected.indexOf(item) === -1;
			});
			return functionManager.createFunction('my_function', selected);

		},

		createParams: function() {
			for (var i = 0; i < selected.length; i++) {
				functionManager.addParamToFunction(currentNode, selected[i]);
			}
		},

		addList: function(selected, registerUndo) {

			var list = collectionManager.initializeList(selected, registerUndo);
			this.deselectAllShapes();
			if (list) {
				if (registerUndo) {
					this.addToUndoStack([collectionManager]);
					this.modificationEnded([collectionManager]);
				}
				layersView.addList(list.toJSON());
				this.selectShape(list);
				this.addListener(list);

				return list;
			}
		},


		unGroup: function(registerUndo) {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'ungroup'
			});
			var removed_geom = [];
			var removed = [];
			var removed_list = [];
			var modified = [];
			if (registerUndo) {
				for (var m = 0; m < selected.length; m++) {
					var constrained = constraintManager.inConstraint(selected[m]);
					if (constrained) {
						constraintManager.addToUndoStack();
						modified.push(constraintManager);
						break;
					}
				}

				if (selected.filter(function(s) {
						return s.get('type') == 'collection';
					}).length > 0) {
					collectionManager.addToUndoStack();

					modified.push(collectionManager);
				}

				if (selected.filter(function(s) {
						return s.get('type') == 'geometry';
					}).length > 0) {
					currentNode.addToUndoStack();
					modified.push(currentNode);
				}
			}


			for (var i = 0; i < selected.length; i++) {

				switch (selected[i].get('type')) {
					case 'geometry':
						if (selected[i].get('name') == 'group') {
							var removedItems = selected[i].unGroup();
							removed_geom.push.apply(removed_geom, removedItems);
							removed.push.apply(removed, removedItems);
							this.removeGeometry(selected[i]);

						}
						break;
					case 'collection':
						var removedItems = collectionManager.removeCollection(selected[i]);
						this.removeCollection(selected[i]);

						removed.push.apply(removed, removedItems);
						removed_list.push.apply(removed_list, removedItems);
						break;
				}
			}

			if (removed_geom.length > 0) {
				for (var j = 0; j < removed_geom.length; j++) {
					layersView.addShape(removed_geom[j].toJSON());
				}
				currentNode.addMultipleChildren(removed_geom);
			}
			if (registerUndo) {
				this.addToUndoStack(modified);
				this.modificationEnded(modified);
			}
			this.deselectAllShapes();
			this.selectShape(removed);
		},


		addCopy: function(selected, registerUndo) {
			var geom_copy = [];
			var list_copy = [];
			var list_geom = [];
			var copies = [];
			var modified = [];
			for (var i = 0; i < selected.length; i++) {
				var copy;
				if (selected[i].get('type') == 'collection') {
					copy = selected[i].create(true, list_geom);
					list_copy.push(copy);
					layersView.addList(copy.toJSON());

				} else {
					copy = selected[i].create();
					geom_copy.push(copy);

				}
				copies.push(copy);


			}
			this.deselectAllShapes();

			geom_copy.push.apply(geom_copy, list_geom);

			if (geom_copy.length > 0) {
				for (var j = 0; j < geom_copy.length; j++) {
					layersView.addShape(geom_copy[j].toJSON());
				}
				currentNode.addMultipleChildren(geom_copy, registerUndo);
				modified.push(currentNode);

			}
			if (list_copy.length > 0) {
				collectionManager.addMultipleLists(list_copy, registerUndo);
				modified.push(collectionManager);

			}
			if (registerUndo) {
				this.addToUndoStack(modified);
				this.modificationEnded(modified);
			}
			this.selectShape(copies);
			return selected;
		},

		addShape: function(shape, registerUndo) {
			if (!shape.nodeParent) {
				currentNode.addChildNode(shape, registerUndo);
				this.addToUndoStack([currentNode]);
				this.modificationEnded([currentNode]);
			}
			if (shape.get('name') !== 'ui-item' && shape.get('name') !== 'ui') {
				layersView.addShape(shape.toJSON());
			}
			this.selectShape(shape);

			return shape;

		},


		addGroup: function(selected, registerUndo) {
			var group = new Group({}, {
				geometryGenerator: GeometryGenerator
			});
			currentNode.addChildNode(group, true);
			selected.sort(function(a, b) {
				return a.get('zIndex').getValue() - b.get('zIndex').getValue();
			});
			for (var j = 0; j < selected.length; j++) {
				group.addChildNode(selected[j]);
			}

			this.addToUndoStack([currentNode]);
			this.modificationEnded([currentNode]);



			for (var i = 0; i < selected.length; i++) {
				layersView.removeShape(selected[i].get('id'));
			}


			layersView.addShape(group.toJSON());
			this.deselectAllShapes();
			this.selectShape(group);
			return group;

		},

		//called when duplicator is loaded in via JSON
		addDuplicator: function(duplicator) {
			this.deselectAllShapes();
			currentNode.addChildNode(duplicator);
			collectionManager.addDuplicator(null, duplicator);
			layersView.addShape(duplicator.toJSON());
			return duplicator;
		},

		initializeDuplicator: function(object, registerUndo) {
			this.deselectAllShapes();
			var index = object.index;
			var nodeParent = object.nodeParent;
			nodeParent.removeChildNode(object, registerUndo);
			var duplicator = new Duplicator({}, {
				geometryGenerator: GeometryGenerator
			});

			duplicator.setTarget(object);

			var data = duplicator.setCount(3);

			currentNode.insertChild(index, duplicator);


			layersView.removeShape(object.get('id'));
			layersView.addShape(duplicator.toJSON());
			this.selectShape(duplicator);
			this.duplicatorCountModified(data, duplicator);
			var constraints = duplicator.setInternalConstraint();
			constraintManager.addConstraintArray(constraints, registerUndo);

			this.addToUndoStack([constraintManager, nodeParent]);
			this.modificationEnded([constraintManager, nodeParent]);

			for (var i = 0; i < constraints.length; i++) {

				layersView.addConstraint(constraints[i]);

			}
			return duplicator;
		},

		duplicatorCountModified: function(data, duplicator) {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'modify duplicator count'
			});
			if (data.toRemove) {
				for (var i = 0; i < data.toRemove.length; i++) {
					collectionManager.removeObjectFromLists(data.toRemove[i]);
				}
			}

			layersView.removeChildren(duplicator.get('id'));
			for (var k = 0; k < duplicator.children.length; k++) {
				layersView.addShape(duplicator.children[k].toJSON(), duplicator.get('id'));
			}
			layersView.sortChildren(duplicator.get('id'));
			this.updateListConstraints(duplicator);

		},

		setDuplicatorCount: function(value, duplicator) {
			var data;
			if (duplicator) {
				data = duplicator.setCount(value);
				this.duplicatorCountModified(data, duplicator);
			} else {
				for (var i = 0; i < selected.length; i++) {
					data = selected[i].setCount(value, !stateStored);
					this.duplicatorCountModified(data, selected[i]);
				}

				this.addToUndoStack(selected);
				this.modificationEnded(selected);

			}
		},

		addConstraint: function(constraint, noUpdate) {
			analytics.log(eventType, {
				type: eventType,
				id: 'constraint',
				action: 'addConstraint'
			});


			constraintManager.addConstraint(constraint, !stateStored);
			this.addToUndoStack([constraintManager]);
			this.modificationEnded([constraintManager]);
			layersView.addConstraint(constraint);
			if (!noUpdate) {
				this.updateMapView(constraint.get('id'));
			}

			this.trigger('modified');
		},

		removeConstraint: function(id, registerUndo) {
			var removed = constraintManager.removeConstraint(id, registerUndo);
			if (removed) {
				if (registerUndo) {
					this.addToUndoStack([constraintManager]);
					this.modificationEnded([constraintManager]);
				}
				this.visualizeConstraint();
				layersView.removeConstraint(id);
			}
		},



		reorderShapes: function(movedId, relativeId, mode) {
			var movedShape = this.getById(movedId);
			var relativeShape = this.getById(relativeId);
			if (movedShape && relativeShape) {
				switch (mode) {
					case 'over':

						if (movedShape.nodeParent == relativeShape) {
							return false;
						}
						if (relativeShape.get('name') === 'duplicator') {
							return false;
						}
						if (relativeShape.get('name') === 'group') {
							relativeShape.addChildNode(movedShape, !stateStored);
							this.addToUndoStack([relativeShape]);
							this.modificationEnded([relativeShape]);

							layersView.removeChildren(relativeShape.get('id'));
							for (var i = 0; i < relativeShape.children.length; i++) {
								layersView.addShape(relativeShape.children[i].toJSON(), relativeShape.get('id'));
							}
							layersView.sortChildren(relativeShape.get('id'));
						}
						break;
					default:
						//console.log('moved shape is sibing', movedShape.isSibling(relativeShape));
						if (!movedShape.isSibling(relativeShape)) {
							var parent = movedShape.getParentNode();
							if (parent.get('name') === 'group') {
								if (parent.nodeParent.get('name') === 'duplicator') {
									return false;
								}
								parent.removeChildNode(movedShape, !stateStored);
								this.addToUndoStack([parent]);
								this.modificationEnded([parent]);


							} else if (parent.get('name') === 'duplicator') {

								var success = parent.removeChildNode(movedShape, true, !stateStored);
								this.addToUndoStack([parent]);
								this.modificationEnded([parent]);
								if (!success) {
									return false;
								}

							}

							currentNode.addChildNode(movedShape);


						}

						//console.log('mode', mode);
						switch (mode) {
							case 'after':
								movedShape.getParentNode().setChildBefore(movedShape, relativeShape);
								break;
							case 'before':
								movedShape.getParentNode().setChildAfter(movedShape, relativeShape);
								break;
						}
						break;
				}
			}
			return true;
		},

		selectShape: function(data, segments) {
			if (data instanceof Array) {
				for (var i = 0; i < data.length; i++) {
					this._selectSingleShape(data[i], segments);
				}
			} else {
				this._selectSingleShape(data, segments);
			}
			if (!constraintMode) {
				collectionView.toggleCollectionButtons(selected);
			}
			this.updateLayers();
		},



		_selectSingleShape: function(instance, segments) {
			if (instance.get('type') == 'geometry') {
				instance = instance.filterSelection();
			}
			var data = collectionManager.filterSelection(instance);
			if (data) {
				this.deselectShape(data.toRemove);
				this.selectShape(data.toAdd);
			} else {
				if (!_.contains(selected, instance)) {
					selected.push(instance);
				}
				instance.select(segments);
			}

		},

		deselectShape: function(data) {
			if (typeof data === 'string') {
				var s = this.getById(data);
				this._deselectSingleShape(s);
			} else if (data instanceof Array) {
				for (var i = 0; i < data.length; i++) {
					var shape = data[i];
					shape.deselect();
				}

				var newShapes = selected.filter(function(item) {
					return !_.contains(data, item);
				});
				selected = newShapes;
				functionManager.selected = newShapes;
			} else {
				this._deselectSingleShape(data);
			}
			this.updateLayers();
			if (!constraintMode) {
				collectionView.toggleCollectionButtons(selected);
			}



		},


		_deselectSingleShape: function(shape) {
			shape.deselect();

			if (_.contains(selected, shape)) {
				var index = _.indexOf(selected, shape);
				selected.splice(index, 1);
			}
		},


		deselectAllShapes: function() {
			// TODO: do this across all selections
			for (var i = selected.length - 1; i >= 0; i--) {
				selected[i].deselect();
			}
			selected.length = 0;
			this.updateLayers();
			collectionView.toggleCollectionButtons(selected);

		},

		//returns currently selected objects
		getCurrentSelection: function(reference) {
			reference.selected = selected;
			return selected;
		},

		getLastSelected: function() {
			if (selected.length > 0) {
				return selected[selected.length - 1];
			}
		},

		//modifies the visibility of objects that are selected
		changeModeForSelection: function(mode, modifier) {
			for (var i = 0; i < selected.length; i++) {
				selected[i].setSelectionForInheritors(true, mode, modifier, 1);
			}
		},


		updateLayers: function() {
			var layer_shapes = selected.map(function(item) {
				if (item.get('name') === 'point') {
					return item.nodeParent;
				} else {
					return item;
				}
			});

			layersView.updateSelection(layer_shapes);
		},

		//event handler called when mapping is changed
		updateMapping: function(values) {
			var cId = layersView.getActiveConstraint();
			if (cId) {
				var constraint = this.getConstraintById(cId);
				constraint.calculateReferenceValues();
			}
		},

		updateMinMax: function(min, max, values) {
			var cId = layersView.getActiveConstraint();
			if (cId) {
				var constraint = this.getConstraintById(cId);
				constraint.setMin(min);
				constraint.setMax(max);
				constraint.calculateReferenceValues();
			}

		},

		updateListConstraints: function(list) {
			var constraints = this.getConstraintsByRelative(list);
			var cId = layersView.getActiveConstraint();
			if (constraints.length > 0) {
				for (var i = 0; i < constraints.length; i++) {
					var constraint = constraints[i];
					if (cId && cId === constraint.get('id')) {
						this.updateMapView(constraint.get('id'));
					}

				}
			}
		},

		updateMapView: function(id) {
			var constraint = this.getConstraintById(id);
			mapView.setConstraint(constraint);
		},


		hideShape: function(shape) {
			if (typeof shape === 'string') {
				var selected = this.getById(shape);
				selected.hide();
				this.deselectShape(selected);
			} else {
				shape.hide();
				this.deselectShape(shape);

			}
		},

		showShape: function(shape) {
			if (typeof shape === 'string') {
				var selected = this.getById(shape);
				selected.show();
				this.selectShape(selected);

			} else {
				shape.show();
				this.selectShape(shape);
			}
		},

		modificationEnded: function(objects) {
			var targets;
			if (objects) {
				targets = objects;
			} else {
				targets = selected;
			}
			if (targets.length > 0) {
				for (var i = 0; i < targets.length; i++) {
					var instance = targets[i];
					instance.setValueEnded();
				}
			}
			stateStored = false;
		},

		modifyGeometry: function(data, modifiers) {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'modify geometry'
			});
			if (selected.length > 0) {

				for (var i = 0; i < selected.length; i++) {
					var instance = selected[i];
					instance.setValue(data, !stateStored);
				}
				this.addToUndoStack(selected);

			}
		},


		modifySegment: function(data, handle, modifiers) {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'modify segment'
			});
			var instances = selected.filter(function(item) {
				return item.get('name') != 'point';
			});
			if (instances.length > 0) {
				for (var i = 0; i < instances.length; i++) {
					var instance = instances[i];
					instance.modifyPoints(data, this.get('tool-mode'), this.get('tool-modifier'), null, !stateStored);
				}
				this.addToUndoStack(selected);
			}
		},

		modifyParams: function(data) {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'modify params'
			});
			if (selected.length > 0) {
				for (var i = 0; i < selected.length; i++) {
					selected[i].updateParams(data);
				}
			}
		},

		modifyStyle: function(style_data) {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'modify style'
			});
			if (selected.length > 0) {
				var non_group_selected = [];
				for (var i = 0; i < selected.length; i++) {
					var instance = selected[i];
					instance.setValue(style_data, !stateStored);
					non_group_selected.push.apply(non_group_selected, instance.getInstanceChildren());
				}
				this.addToUndoStack(non_group_selected);
			}
		},


		/* toggleOpen
		 * returns children of opened function or members of opened lists
		 */
		toggleOpen: function() {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'toggle open'
			});
			paper.project.activeLayer.opacity = 0.25;

			var data = collectionManager.toggleOpen(selected[selected.length - 1]);
			this.deselectAllShapes();
			if (data.toSelect && data.toSelect.length > 0) {
				this.selectShape(data.toSelect);
			}
		},

		/* toggleClosed
		 * closes open functions or selected open lists
		 */
		toggleClosed: function() {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'toggle closed'
			});
			paper.project.activeLayer.opacity = 1;

			var data = collectionManager.toggleClosed(selected[selected.length - 1]);
			this.deselectAllShapes();
			if (data.toSelect && data.toSelect.length > 0) {
				this.selectShape(data.toSelect);
				//TODO: some issue here with correctly selecting shapes when list is toggled closed.
			}
		},



	});

	return MasterManager;


});