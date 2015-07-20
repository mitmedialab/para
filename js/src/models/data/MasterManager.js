/*MasterManager.js
 * manager for all subtype managers (FunctionManager, ListManager, ConstraintManager)
 * stores and manages selected objects
 */

define([
	'underscore',
	'backbone',
	'models/data/Instance',
	'models/data/functions/FunctionNode',
	'models/data/functions/FunctionManager',
	'models/data/collections/CollectionManager',
	'views/LayersView',
	'views/CollectionView',
	'views/MapView'


], function(_, Backbone, Instance, FunctionNode, FunctionManager, CollectionManager, LayersView, CollectionView, MapView) {
	//datastructure to store path functions
	//TODO: make linked list eventually

	//stores para lists

	var renderQueue = [];
	var constraints = [];
	var store = 0;
	var compile = 1;
	var remove = 2;
	var visit = 3;
	var search = 4;
	var rootNode, currentNode, layersView, collectionView, mapView, functionManager, collectionManager, selected, currentSelectionIndex;

	var constraintPropMap = {
		'position': 'translation_delta',
		'scale': 'scaling_delta',
		'rotation': 'rotation_delta',
		'fill': 'fill_color',
		'stroke': 'stroke_color'
	};

	var MasterManager = Backbone.Model.extend({
		defaults: {},

		initialize: function() {
			//setup root node
			rootNode = new FunctionNode();
			rootNode.open();
			selected = rootNode.selected;
			rootNode.set('name', 'root');
			this.listenTo(rootNode, 'parseJSON', this.parseJSON);
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
			mapView = new MapView({
				model: this
			});

			this.listenTo(collectionManager, 'addToRender', this.addToRenderQueue);
			this.listenTo(collectionManager, 'listLengthChange', this.updateListConstraints);
			this.listenTo(collectionManager, 'duplicatorCountModified', this.duplicatorCountModified);



		},

		getById: function(id) {
			var prefix = id.split('_')[0];
			console.log('prefix', prefix);
			var obj;
			switch (prefix) {
				case 'collection':
					obj = collectionManager.getCollectionById(id);
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


		//TODO: move to constraint manager
		visualizeConstraint: function(ref, rel, pref, prel) {
			var ref_i, rel_i;
			if (pref && prel) {
				var pref_i = this.getById(pref);
				var prel_i = this.getById(prel);
				pref_i.set('constraint_selected', null);
				prel_i.set('constraint_selected', null);
				this.compile();

			}
			if (ref && rel) {
				console.log('rel id =', rel);
				ref_i = this.getById(ref);
				rel_i = this.getById(rel);
				ref_i.set('constraint_selected', 'reference_selected');
				rel_i.set('constraint_selected', 'relative_selected');
				this.compile();

			} else {
				if (layersView.getCurrentRef() && layersView.getCurrentRel()) {
					ref_i = this.getById(layersView.getCurrentRef());
					rel_i = this.getById(layersView.getCurrentRel());
					if (ref_i) {
						ref_i.set('constraint_selected', null);
					}
					if (rel_i) {
						rel_i.set('constraint_selected', null);
					}
					layersView.deactivateConstraint();
					mapView.deactivate();
					this.compile();

				}
			}
		},

		compile: function() {
			renderQueue = [];
			collectionManager.resetRenderQueue();
			this.compileFunctions();
			collectionManager.compileCollections();
			this.compileInstances();
			this.render();
		},

		//TODO: move to function manager
		compileFunctions: function() {
			var state_data = {
				func: compile,
				instance: compile
			};
			var functions = functionManager.functions;
			for (var i = 0; i < functions.length; i++) {
				this.visit(functions[i], null, state_data);
			}
		},

		//TODO: move to Geom manager
		compileInstances: function() {
			var state_data = {
				list: store,
				instance: compile,
				func: compile,
			};

			this.visit(currentNode, null, state_data);
		},

		addToRenderQueue: function(obj) {
			renderQueue.push(obj);
		},

		render: function(root) {
			_.sortBy(renderQueue, function(item) {
				return item.get('order');
			});
			for (var i = 0; i < renderQueue.length; i++) {
				renderQueue[i].render();

			}
			collectionManager.render();
		},

		addObject: function(object, geom) {
			switch (object) {
				case 'geometry':
					this.addShape(geom);
					break;
				case 'instance':
					this.addInstance();
					break;
				case 'function':
					this.addFunction(collectionManager.getLists());
					break;
				case 'param':
					this.createParams();
					break;
				case 'list':
					var list = collectionManager.addList(selected);
					layersView.addList(list.toJSON());
					this.deselectAllShapes();
					this.selectShape(list);
					break;
				case 'group':

					break;

				case 'duplicator':
					var duplicator = collectionManager.addDuplicator(selected);
					layersView.addList(duplicator.toJSON());
					this.deselectAllShapes();
					this.selectShape(duplicator);
					break;
			}

		},

		unGroup: function() {
			console.log('ungroup', selected);
			for (var i = 0; i < selected.length; i++) {
				switch (selected[i].get('type')) {
					case 'geometry':
						if (selected[i].get('name') == 'group') {
							var members = selected[i].deleteSelf();
							var parent = selected[i].getParentNode();
							if (parent) {
								parent.removeInheritor(selected[i]);
								parent.removeChildNode(selected[i]);
								parent.addChildNode(members);
							} else {
								currentNode.addChildNode(members);
							}
							this.deselectAllShapes();
							this.selectShape(members);
						}
						break;
					case 'collection':
						layersView.removeCollection(selected[i].get('id'));
						var removedItems = collectionManager.removeCollection(selected[i]);
						console.log('removed items =', removedItems);
						this.deselectAllShapes();
						this.selectShape(removedItems);
						break;
				}
			}
		},


		removeObjectById: function(id){
			var object = this.getById(id);
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
						layersView.removeCollection(id);
						var removedItems = collectionManager.removeCollection(object);
						this.selectShape(removedItems);
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
						layersView.removeCollection(selected[i].get('id'));
						var removedItems = collectionManager.removeCollection(selected[i]);
						this.deselectAllShapes();
						this.selectShape(removedItems);
						break;
				}
			}
			this.compile();
		},

		removeGeometry: function(target) {
			target.deleteSelf();
			var parent = target.getParentNode();
			if (parent) {
				parent.removeInheritor(target);
				parent.removeChildNode(target);
			}
		},

		/*visit
		 * visitor method to walk the tree and compute and render each
		 * node on the screen according to type;
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
				case compile:
					node.reset();
					node.compile();
					renderQueue.push(node);

					for (var i = 0; i < children.length; i++) {
						if (!node.get('open') && node.get('called')) {
							if (children[i].isReturned) {
								children[i].visit(this, 'visit', node, state_data);
							}
						} else if (node.get('open')) {
							children[i].visit(this, 'visit', node, state_data);
						}
					}

					break;
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
				case compile:
					node.reset();
					node.compile();
					var dIndex = 0;
					if (departureNode) {
						dIndex = departureNode.get('order');
					}
					node.set('order', dIndex + node.getChildIndex());
					renderQueue.push(node);
					for (var i = 0; i < children.length; i++) {
						children[i].visit(this, 'visit', node, state_data);
					}
					break;
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
			functionManager.createFunction('my_function', selected);
			this.compile();
		},

		createParams: function() {
			for (var i = 0; i < selected.length; i++) {
				functionManager.addParamToFunction(currentNode, selected[i]);
			}
			this.compile();
		},

		addShape: function(shape) {

			if (!shape.parentNode) {
				currentNode.addChildNode(shape);
			}
			collectionManager.addToOpenLists(shape);
			if (shape.get('name') !== 'ui-item' && shape.get('name') !== 'ui') {
				layersView.addShape(shape.toJSON());
			}
			this.selectShape(shape);
		},

		//called when creating an instance which inherits from existing shape
		addInstance: function() {
			var parent = this.getLastSelected();

			if (parent) {
				this.deselectShape(parent);
				var newInstance = parent.create();
				parent.set('selected', false);
				newInstance.set('selected', true);
				collectionManager.addToOpenLists(newInstance);
				layersView.addInstance(newInstance.toJSON(), parent.get('id'));
				this.selectShape(newInstance);
				return newInstance;
			}
		},

		duplicatorCountModified: function(data,duplicator) {
			if (data.toRemove) {
				for (var i = 0; i < data.toRemove.length; i++) {
					collectionManager.removeObjectFromLists(data.toRemove[i]);
					layersView.removeShape(data.toRemove[i].get('id'));

				}
			}
			if (data.toAdd) {
				for (var j = 0; j < data.toAdd.length; j++) {
					layersView.addInstance(data.toAdd[j].toJSON(),data.toAdd[j].get('proto_node').get('id'));
				}
			}
			this.updateListConstraints(duplicator);

			this.compile();
		},

		setDuplicatorCount: function(value){
			for(var i=0;i<selected.length;i++){
				var data = selected[i].setCount(value);
				this.duplicatorCountModified(data,selected[i]);
			}
		},

		addConstraint: function(constraint) {
			constraints.push(constraint);
			layersView.addConstraint(constraint);
			this.updateMapView(constraint.get('id'));

		},

		removeConstraint: function(id) {
			var constraint = this.getConstraintById(id);
			if (constraint) {
				var reference = constraint.get('references');

				var relative = constraint.get('relatives');

				relative.get(constraint.get('rel_prop_key')).removeConstraint(constraint.rel_prop_dimensions);
				this.visualizeConstraint();
				layersView.removeConstraint(constraint.get('id'));
			}
		},

		reorderShapes: function(movedId, relativeId, mode) {
			var movedShape = this.getById(movedId);
			var relativeShape = this.getById(relativeId);
			if (movedShape && relativeShape) {
				switch (mode) {
					case 'over':
						relativeShape.addInheritor(movedShape);
						break;
					default:
						if (movedShape.isSibling(relativeShape)) {
							switch (mode) {
								case 'after':
									movedShape.getParentNode().setChildAfter(movedShape, relativeShape);
									break;
								case 'before':
									movedShape.getParentNode().setChildBefore(movedShape, relativeShape);
									break;
							}
						}
						break;
				}
			}
			this.compile();
		},

		selectShape: function(data) {
			if (data instanceof Array) {
				for (var i = 0; i < data.length; i++) {
					this._selectSingleShape(data[i]);
				}
			} else {
				this._selectSingleShape(data);
			}
			this.updateLayers();
			collectionView.toggleCollectionButtons(selected);
			this.compile();

		},



		_selectSingleShape: function(instance) {
			if (!_.contains(selected, instance)) {
				instance.set('selected', true);
				instance.setSelectionForInheritors(true, this.get('tool-mode'), this.get('tool-modifier'), 1);
				selected.push(instance);
				if (instance.get('name') != 'point') {
					var data = collectionManager.filterSelection(instance);
					if (data) {
						this.deselectShape(data.toRemove);
						this.selectShape(data.toAdd);
					}
				}
			}
		},

		deselectShape: function(data) {
			if (typeof data === 'string') {
				var s = this.getById(data);
				this._deselectSingleShape(s);
			} else if (data instanceof Array) {
				for (var i = 0; i < data.length; i++) {
					var shape = data[i];
					shape.set('selected', false);
					shape.setSelectionForInheritors(false);
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
			collectionView.toggleCollectionButtons(selected);
			this.compile();


		},


		_deselectSingleShape: function(shape) {
			shape.set('selected', false);
			shape.setSelectionForInheritors(false);

			if (_.contains(selected, shape)) {
				var index = _.indexOf(selected, shape);
				selected.splice(index, 1);
			}
		},


		deselectAllShapes: function() {
			// TODO: do this across all selections
			for (var i = selected.length - 1; i >= 0; i--) {
				selected[i].set('selected', false);
				selected[i].setSelectionForInheritors(false);
			}
			selected.length = 0;
			this.updateLayers();
			collectionView.toggleCollectionButtons(selected);
			this.compile();

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
				constraint.setMultipliers(values);
				this.compile();
			}
		},

		updateMinMax: function(min, max, values) {
			var cId = layersView.getActiveConstraint();
			if (cId) {
				var constraint = this.getConstraintById(cId);
				constraint.setMin(min);
				constraint.setMax(max);
				constraint.setMultipliers(values);
				this.compile();
			}

		},

		updateListConstraints: function(list) {
			var constraints = this.getConstraintsByRelative(list);
			var cId = layersView.getActiveConstraint();
			if (constraints.length > 0) {
				for (var i = 0; i < constraints.length; i++) {
					var constraint = constraints[i];
					constraint.setMultiplierLength();
					constraint.matchProperty(constraint.get('ref_prop'), constraint.get('rel_prop'));
					var values = mapView.calculateValueSet(constraint);
					console.log('updated values', values, constraint.getRange());
					constraint.setMultipliers(values);
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

		modifyGeometry: function(data, modifiers) {
			if (selected.length > 0) {
				for (var i = 0; i < selected.length; i++) {
					var instance = selected[i];
					instance.modifyProperty(data, this.get('tool-mode'), this.get('tool-modifier'));
				}
				this.compile();
			}
		},


		modifySegment: function(data, handle, modifiers) {
			if (selected.length > 0) {
				for (var i = 0; i < selected.length; i++) {
					var instance = selected[i];
					instance.nodeParent.modifyPoints(data, this.get('tool-mode'), this.get('tool-modifier'));
				}
				this.compile();
			}
		},

		modifyParams: function(data) {
			if (selected.length > 0) {
				for (var i = 0; i < selected.length; i++) {
					selected[i].updateParams(data);
				}
				this.compile();
			}
		},

		modifyStyle: function(style_data) {
			if (selected.length > 0) {
				for (var i = 0; i < selected.length; i++) {
					var instance = selected[i];
					instance.modifyProperty(style_data, this.tool_mode, this.tool_modifer);
				}
				this.compile();
			}
		},


		/* toggleOpen
		 * returns children of opened function or members of opened lists
		 */
		toggleOpen: function() {
			var data;
			var functions = selected.filter(function(item) {
				return item.get('type') === 'function';
			});
			if (functions.length > 0) {
				collectionManager.closeAllLists();
				currentNode.lists = collectionManager.getLists();
				data = functionManager.toggleOpenFunctions(currentNode, functions[functions.length - 1]);
				collectionManager.setLists(data.lists);
				currentNode = data.currentNode;
			} else {
				data = collectionManager.toggleOpenLists(selected);
			}
			console.log('toggleOpen', data.toSelect, data.toRemove);

			if (data.toRemove && data.toRemove.length > 0) {
				this.deselectShape(data.toRemove);
			}
			if (data.toSelect && data.toSelect.length > 0) {
				this.selectShape(data.toSelect);
			}
		},

		/* toggleClosed
		 * closes open functions or selected open lists
		 */
		toggleClosed: function() {
			var data = collectionManager.toggleClosedLists(selected);

			if (data.toSelect.length < 1) {
				collectionManager.closeAllLists();
				currentNode.list = collectionManager.getLists();
				data = functionManager.toggleClosedFunctions(currentNode, rootNode);
				currentNode = data.currentNode;
				collectionManager.setLists(currentNode.lists);
			}
			console.log('to remove', data.toRemove, 'to select', data.toSelect);

			if (data.toRemove && data.toRemove.length > 0) {
				this.deselectShape(data.toRemove);
			}
			if (data.toSelect && data.toSelect.length > 0) {
				this.selectShape(data.toSelect);
				console.log('selecting shapes', data.toSelect);
				//TODO: some issue here with correctly selecting shapes when list is toggled closed.
			}
		},





	});

	return MasterManager;


});