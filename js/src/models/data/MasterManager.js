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



], function(_, paper, Backbone, Instance, Group, PathNode, SVGNode, RectNode, EllipseNode, PolygonNode, FunctionNode, FunctionManager, CollectionManager, Duplicator, Constraint, ConstrainableList, LayersView, CollectionView, MapView, SaveExportView, analytics) {
	//debug vars for testing framerate
	var fps = 0,
		now, lastUpdate = (new Date()) * 1;
	var fpsFilter = 10;

	var undoManager;
	//stores para lists
	var eventType = 'state_manager';
	var constraints = [];
	var store = 0;
	var remove = 2;
	var visit = 3;
	var search = 4;
	var rootNode, currentNode, layersView, collectionView, mapView, functionManager, collectionManager, selected, currentSelectionIndex;
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


	var MasterManager = Backbone.Model.extend({
		defaults: {},

		initialize: function() {
			//setup root node
			//

			rootNode = new FunctionNode();


			rootNode.open();
			selected = rootNode.selected;
			rootNode.set('name', 'root');
			currentNode = rootNode;
			functionManager = new FunctionManager();
			functionManager.selected = selected;
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
		
		addToUndoStack:function(selected){
			if (!stateStored) {
				var selected_ids = [];
				for(var i=0;i<selected.length;i++){
					selected_ids.push(selected[i].get('id'));
				}
				undoStack.push(selected_ids);
				stateStored = true;
				console.log('succesfully added to undo stack',undoStack);
				redoStack = [];

			}
		},

		undo: function(event) {
			console.log('undo', undoStack);
			if (undoStack.length > 0) {
				var toUndo = undoStack.pop();
				var self = this;
				toUndo.forEach(function(id) {
					var item = self.getById(id);
					item.undo();

				});
				redoStack.push(toUndo);
			}


		},

		redo: function() {
			console.log('redo', redoStack);
			if (redoStack.length > 0) {
				var toRedo = redoStack.pop();
				var self = this;
				toRedo.forEach(function(id) {
					var item = self.getById(id);
					console.log('item found',item);
					item.redo();
				});
				undoStack.push(toRedo);
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
			var lists = json.lists;
			var geometry = json.geometry.children;
			var constraints = json.constraints;
			for (var i = 0; i < geometry.length; i++) {
				var geom;
				switch (geometry[i].name) {

					case 'duplicator':
						var duplicator = new Duplicator();
						duplicator.parseJSON(geometry[i]);
						this.addDuplicator(duplicator);
						break;
					case 'group':
						var group = new Group();
						group.parseJSON(geometry[i]);
						this.addGroup(null, group);
						break;
					default:
						switch (geometry[i].name) {
							case 'path':
								geom = new PathNode();
								break;
							case 'rectangle':
								geom = new RectNode();
								break;
							case 'ellipse':
								geom = new EllipseNode();
								break;
							case 'polygon':
								geom = new PolygonNode();
								break;

						}
						geom.parseJSON(geometry[i], this);
						this.addShape(geom, true);
						break;

				}
			}

			for (var j = 0; j < lists.length; j++) {
				var list = new ConstrainableList();
				var toAdd = list.parseJSON(lists[j], this);
				for (var k = 0; k < toAdd.length; k++) {
					layersView.addList(toAdd[k].toJSON());
					this.addListener(toAdd[k]);
				}
				collectionManager.addList(null, list);
			}

			for (var m = 0; m < constraints.length; m++) {
				var constraint = new Constraint();
				constraint.parseJSON(constraints[m], this);
				this.addConstraint(constraint, true);

			}

			paper.view.draw();
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
				/*if (children.length > 1) {
					this.addGroup(new_children);
				}*/
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

		exportProjectJSON: function(json) {
			analytics.log(eventType, {
				type: eventType,
				id: 'export',
				action: 'Ï'
			});
			var geometry_json = rootNode.toJSON();
			var constraint_json = [];
			for (var i = 0; i < constraints.length; i++) {
				constraint_json.push(constraints[i].toJSON());
			}
			var list_json = collectionManager.getListJSON();
			var project_json = {
				geometry: geometry_json,
				constraints: constraint_json,
				lists: list_json
			};
			return project_json;
		},

		deleteAll: function() {
			this.deleteAllConstraints();
			this.deselectAllShapes();
			layersView.deleteAll();
			mapView.deactivate();


			var deleted_collections = collectionManager.deleteAll();
			var deleted_instances = rootNode.deleteAllChildren([]);

			for (var i = 0; i < deleted_instances.length; i++) {
				this.stopListening(deleted_instances[i]);
			}
			for (var j = 0; j < deleted_collections.length; j++) {
				this.stopListening(deleted_collections[j]);
			}
			//console.log('number of paper instances',paper.project.layers[0].children.length,paper.project.layers[1].children.length);
		},



		getById: function(id) {
			var prefix = id.split('_')[0];
			var obj;
			switch (prefix) {
				case 'collection':
					obj = collectionManager.getCollectionById(id);
					break;
				case 'internalcollection':
					obj = collectionManager.getInternalList(id);
					break;
				case 'constraint':
					obj = this.getConstraintById(id);
					break;
				default:
					obj = this._getGeomById(id);
					break;
			}
			return obj;
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
			var constraint = constraints.filter(function(constraint) {
				return constraint.get('id') === id;
			})[0];
			return constraint;
		},

		getConstraintsByRelative: function(relative) {
			var rel_constraints = constraints.filter(function(constraint) {
				return constraint.get('relatives') === relative;
			});
			return rel_constraints;
		},

		getConstraintsByReference: function(reference) {
			var ref_constraints = constraints.filter(function(constraint) {
				return constraint.get('references') === reference;
			});
			return ref_constraints;
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
			this.stopListening(target);
			target.compile();
			target.render();
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
					added = this.addShape(geom);
					break;
				case 'instance':
					added = this.addCopy(selected);
					break;
				case 'list':
					var list = collectionManager.addList(selected);
					this.deselectAllShapes();
					if (list) {
						layersView.addList(list.toJSON());
						this.selectShape(list);
						this.addListener(list);
						added = list;
					}
					break;
				case 'group':
					added = this.addGroup(selected);
					break;
				case 'duplicator':
					if (selected[0]) {
						added = this.initializeDuplicator(selected[0]);

					}
					break;
			}


			this.trigger('modified');

		},


		unGroup: function() {
			analytics.log(eventType, {
				type: eventType,
				id: 'modify',
				action: 'ungroup'
			});
			for (var i = 0; i < selected.length; i++) {
				switch (selected[i].get('type')) {
					case 'geometry':
						if (selected[i].get('name') == 'group') {


						}
						break;
					case 'collection':
						layersView.removeCollection(selected[i].get('id'));
						var removedItems = collectionManager.removeCollection(selected[i]);
						this.deselectAllShapes();
						this.selectShape(removedItems);
						break;
				}
			}
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
					layersView.removeShape(id);
					this.removeGeometry(object);
					break;
				case 'function':
					//functionManager.removeFunction(selected[i]);
					break;
					//TODO: this replicates functionality in the ungroup function, should this function differently?
				case 'collection':
					this.removeCollection(object);
					break;
				case 'constraint':
					this.removeConstraint(id);
					break;
			}
		},

		removeObject: function() {
			for (var i = 0; i < selected.length; i++) {
				collectionManager.removeObjectFromLists(selected[i]);
				switch (selected[i].get('type')) {
					case 'geometry':
						layersView.removeShape(selected[i].get('id'));
						this.removeGeometry(selected[i]);
						break;
					case 'function':
						//functionManager.removeFunction(selected[i]);
						break;
						//TODO: this replicates functionality in the ungroup function, should this function differently?
					case 'collection':
						this.removeCollection(selected[i]);
						break;
				}
				this.stopListening(selected[i]);

			}
		},

		removeGeometry: function(target) {
			if (target.get('name') === 'duplicator') {
				collectionManager.removeCollection(target);
			}
			var deleted = [];
			deleted.push.apply(deleted, target.deleteAllChildren());
			deleted.push(target.deleteSelf());

			for (var i = 0; i < deleted.length; i++) {
				this.stopListening(deleted[i]);
			}
			var parent = target.getParentNode();
			if (parent) {
				parent.removeInheritor(target);
				parent.removeChildNode(target);
			}

		},

		removeCollection: function(target) {
			layersView.removeCollection(target.get('id'));
			var removedItems = collectionManager.removeCollection(target);
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

		addShape: function(shape, noSelect) {
			if (!shape.nodeParent) {
				currentNode.addChildNode(shape,!stateStored);
				this.addToUndoStack([currentNode]);
				this.modificationEnded([currentNode]);
			}
			//collectionManager.addToOpenLists(shape);
			if (shape.get('name') !== 'ui-item' && shape.get('name') !== 'ui') {
				layersView.addShape(shape.toJSON());
			}
			if (!noSelect) {
				this.selectShape(shape);
			}
			return shape;

		},

		//called when creating an instance which inherits from existing shape
		addInstance: function() {
			var parent = this.getLastSelected();
			if (parent) {
				var duplicator = collectionManager.getDuplicatorThatContains(parent);

				var lastInstance;
				if (duplicator) {
					this.setDuplicatorCount(duplicator.getCountValue() + 1, duplicator);
					lastInstance = duplicator.getLastMember();
					lastInstance.get('translationDelta').setValue(parent.get('translationDelta').getValue());
					duplicator.setIndex(duplicator.getMemberIndex(parent), lastInstance);
				} else {
					duplicator = this.addDuplicator(parent);
					this.deselectShape(duplicator);
					collectionManager.toggleOpenLists([duplicator]);

					this.setDuplicatorCount(2, duplicator);

					lastInstance = duplicator.getLastMember();
				}
				this.deselectShape(parent);

				this.selectShape(lastInstance);

			}
		},

		addCopy: function(selected) {

			for (var i = 0; i < selected.length; i++) {
				var copy = selected[i].create(true);
				rootNode.addChildNode(copy);
				layersView.addShape(copy.toJSON());
				this.selectShape(copy);
				this.deselectShape(selected[i]);
				if (copy.get('type') == 'collection' || copy.get('name') == 'group' || copy.get('name') == 'duplicator') {
					collectionManager.addListCopy(copy);
				}

			}
			return selected;
		},

		addGroup: function(selected, group) {

			group = collectionManager.addGroup(selected, group);
			currentNode.addChildNode(group);

			if (selected) {

				for (var i = 0; i < selected.length; i++) {
					layersView.removeShape(selected[i].get('id'));
				}
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

		initializeDuplicator: function(object, open) {
			this.deselectAllShapes();
			var index = object.index;
			object.nodeParent.removeChildNode(object);
			var duplicator = collectionManager.addDuplicator(object);
			var data = duplicator.setCount(3);
			currentNode.insertChild(index, duplicator);
			layersView.removeShape(object.get('id'));
			layersView.addShape(duplicator.toJSON());
			this.selectShape(duplicator);
			this.duplicatorCountModified(data, duplicator);
			var constraints = duplicator.setInternalConstraint();
			for (var i = 0; i < constraints.length; i++) {
				this.addConstraint(constraints[i]);
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
					data = selected[i].setCount(value);
					this.duplicatorCountModified(data, selected[i]);
				}
			}
		},

		addConstraint: function(constraint, noUpdate) {
			analytics.log(eventType, {
				type: eventType,
				id: 'constraint',
				action: 'addConstraint'
			});
			if (!constraint.get('user_name')) {
				constraint.set('user_name', 'constraint ' + (constraints.length + 1));
			}
			constraints.push(constraint);
			layersView.addConstraint(constraint);
			if (!noUpdate) {
				this.updateMapView(constraint.get('id'));
			}

			this.trigger('modified');
		},

		removeConstraint: function(id) {

			var constraint = this.getConstraintById(id);
			if (constraint) {
				var index = constraints.indexOf(constraint);
				constraints.splice(index, 1);
				constraint.deleteSelf();
				this.visualizeConstraint();
				layersView.removeConstraint(constraint.get('id'));
			}
		},

		deleteAllConstraints: function() {
			for (var i = 0; i < constraints.length; i++) {
				constraints[i].deleteSelf();
			}
			constraints.length = 0;
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
							relativeShape.addChildNode(movedShape);
							layersView.removeChildren(relativeShape.get('id'));
							for (var i = 0; i < relativeShape.members.length; i++) {
								layersView.addShape(relativeShape.members[i].toJSON(), relativeShape.get('id'));
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
								parent.removeChildNode(movedShape);

							} else if (parent.get('name') === 'duplicator') {

								var success = parent.removeChildNode(movedShape, true);
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
			this.updateLayers();
			if (!constraintMode) {
				collectionView.toggleCollectionButtons(selected);
			}

		},



		_selectSingleShape: function(instance, segments) {

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
			console.log('modificationEnded');
			var targets;
			if(objects){
				targets = objects;
			}
			else{
				targets = selected;
			}
			if (targets.length > 0) {
				for (var i = 0; i <targets.length; i++) {
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
					instance.setValue(data,!stateStored);
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
				var non_group_selected= [];
				for (var i = 0; i < selected.length; i++) {
					var instance = selected[i];
					instance.setValue(style_data,!stateStored);
					non_group_selected.push.apply(non_group_selected,instance.getInstanceChildren());
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