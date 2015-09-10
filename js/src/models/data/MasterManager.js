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
	'backbone.undo',



], function(_, paper, Backbone, Instance, Group, PathNode, SVGNode, RectNode, EllipseNode, PolygonNode, FunctionNode, FunctionManager, CollectionManager, Duplicator, Constraint, ConstrainableList,LayersView, CollectionView, MapView, SaveExportView, UndoManager) {
	//datastructure to store path functions
	//TODO: make linked list eventually

	//stores para lists

	var renderQueue = [];
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

	var MasterManager = Backbone.Model.extend({
		defaults: {},

		initialize: function() {
			//setup root node
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

		},

		importProjectJSON: function(json) {
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
						geom.parseJSON(geometry[i]);
						this.addShape(geom, true);
						break;

				}
			}

			for (var j = 0; j < lists.length; j++) {
				var list = new ConstrainableList();
				console.log('list at',j,lists[i],list);
				var toAdd = list.parseJSON(lists[j],this);
				console.log('to add',toAdd);
				for(var k=0;k<toAdd.length;k++){
					layersView.addList(toAdd[k].toJSON());
					this.addListener(toAdd[k]);
				}
				collectionManager.addList(null,list);
			}

			for (var m = 0; m < constraints.length; m++) {
				var constraint = new Constraint();
				constraint.parseJSON(constraints[m],this);
				this.addConstraint(constraint,true);

			}
			paper.view.draw();

		},


         importSVG: function(data){
              var item = new paper.Group();
              item.importSVG(data,{expandShapes:true,applyMatrix:true});
              item=item.reduce();
            
              
             var children = item.removeChildren();
             paper.project.activeLayer.addChildren(children);
             var new_children = [];
              for(var i=0;i<children.length;i++){
              
              		var path = new SVGNode();
              			var pathMatrix = new paper.Matrix();
              			pathMatrix.translate(children[i].bounds.center.x,children[i].bounds.center.y);
              			path.normalizeGeometry(children[i],pathMatrix);
              			this.addShape(path,true);
              			new_children.push(path);
             
              }
             this.addGroup(new_children);

          },


		deleteAll: function() {
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

		exportProjectJSON: function(json) {
			var geometry_json = rootNode.toJSON();
			var constraint_json = [];
			for(var i=0;i<constraints.length;i++){
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
			target.reset();
			target.compile();
			target.render();
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
					this.removeListener(target.members[i], recurse);
				}
			}

		},


		addObject: function(object, geom) {
			switch (object) {
				case 'geometry':
					this.addShape(geom);
					break;
				case 'instance':
					this.addCopy(selected);
					break;
				case 'list':
					var list = collectionManager.addList(selected);
					this.deselectAllShapes();
					if (list) {
						layersView.addList(list.toJSON());
						this.selectShape(list);
						this.addListener(list);
					}
					break;
				case 'group':
					this.addGroup(selected);
					break;
				case 'duplicator':
					if (selected[0]) {
						this.initializeDuplicator(selected[0]);

					}
					break;
			}

		},


		unGroup: function() {
			for (var i = 0; i < selected.length; i++) {
				switch (selected[i].get('type')) {
					case 'geometry':
						if (selected[i].get('name') == 'group') {
							var members = selected[i].deleteSelf();
							var parent = selected[i].getParentNode();
							if (parent) {
								//TODO: this is not going to work...
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
						this.deselectAllShapes();
						this.selectShape(removedItems);
						break;
				}
			}
		},


		removeObjectById: function(id) {
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
			target.deleteSelf();
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
				currentNode.addChildNode(shape);
			}
			//collectionManager.addToOpenLists(shape);
			if (shape.get('name') !== 'ui-item' && shape.get('name') !== 'ui') {
				layersView.addShape(shape.toJSON());
			}
			if (!noSelect) {
				this.selectShape(shape);
			}

			this.addListener(shape);


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
				var copy = selected[i].create();
				rootNode.addChildNode(copy);
				layersView.addShape(copy.toJSON());
				this.addListener(copy);
				this.selectShape(copy);
				this.deselectShape(selected[i]);
				this.addListener(copy, true);
				if (copy.get('type') == 'collection' || copy.get('name') == 'group' || copy.get('name') == 'duplicator') {
					collectionManager.addListCopy(copy);
				}

			}
		},

		addGroup: function(selected, group) {
			group = collectionManager.addGroup(selected, group);
			if (selected) {

				for (var i = 0; i < selected.length; i++) {
					layersView.removeShape(selected[i].get('id'));
				}
			} else {
				for (var j = 0; j < group.members.length; j++) {
					this.addListener(group.members[j]);
				}
			}

			layersView.addShape(group.toJSON());
			this.deselectAllShapes();
			currentNode.addChildNode(group);
			this.addListener(group);
			this.selectShape(group);
			return group;
		},

		//called when duplicator is loaded in via JSON
		addDuplicator: function(duplicator) {
			this.deselectAllShapes();
			currentNode.addChildNode(duplicator);
			collectionManager.addDuplicator(null,duplicator);

			layersView.addShape(duplicator.toJSON());
			this.addListener(duplicator);
			for (var j = 0; j < duplicator.members.length; j++) {
				this.addListener(duplicator.members[j]);
			}
		},

		initializeDuplicator: function(object, open) {
			this.deselectAllShapes();
			var index = object.index;
			object.nodeParent.removeChildNode(object);
			var duplicator = collectionManager.addDuplicator(object);
			currentNode.insertChild(index, duplicator);
			layersView.removeShape(object.get('id'));
			layersView.addShape(duplicator.toJSON());
			this.selectShape(duplicator);
			var data = duplicator.setCount(8);
			this.duplicatorCountModified(data, duplicator);
			this.addListener(duplicator);
			var constraints = duplicator.setInternalConstraint();
			for (var i = 0; i < constraints.length; i++) {
				this.addConstraint(constraints[i]);
			}
			return duplicator;

		},

		duplicatorCountModified: function(data, duplicator) {
			if (data.toRemove) {
				for (var i = 0; i < data.toRemove.length; i++) {
					collectionManager.removeObjectFromLists(data.toRemove[i]);
					this.removeListener(data.toRemove[i], true);
					//layersView.removeShape(data.toRemove[i].get('id'));
				}
			}
			if (data.toAdd) {
				for (var j = 0; j < data.toAdd.length; j++) {
					this.addListener(data.toAdd[j], true);
					//layersView.addShape(data.toAdd[j].toJSON(), duplicator.get('id'), data.toAdd[j].get('zIndex').getValue());
				}
			}
			layersView.removeChildren(duplicator.get('id'));
			for(var k=0;k<duplicator.members.length;k++){
				layersView.addShape(duplicator.members[k].toJSON(), duplicator.get('id'));
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

		addConstraint: function(constraint,noUpdate) {
			if (!constraint.get('user_name')) {
				constraint.set('user_name', 'constraint ' + (constraints.length + 1));
			}
			constraints.push(constraint);
			layersView.addConstraint(constraint);
			if(!noUpdate){
				this.updateMapView(constraint.get('id'));
			}


		},

		removeConstraint: function(id) {
			var constraint = this.getConstraintById(id);
			if (constraint) {
				var reference = constraint.get('references');
				var relative = constraint.get('relatives');
				relative.removeConstraint(constraint.get('rel_prop_key'), constraint.get('rel_prop_dimensions'));
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
						if(movedShape.nodeParent == relativeShape){
							return false;
						}
						if(relativeShape.get('name')==='duplicator'){
							return false;
						}
						if(relativeShape.get('name')==='group'){
							relativeShape.addMember(movedShape);
							layersView.removeChildren(relativeShape.get('id'));
							for(var i=0;i<relativeShape.members.length;i++){
								layersView.addShape(relativeShape.members[i].toJSON(),relativeShape.get('id'));
							}
							layersView.sortChildren(relativeShape.get('id'));
						}
						break;
					default:
						if (!movedShape.isSibling(relativeShape)) {
							var parent = movedShape.getParentNode();
							console.log('parent name:',parent.get('name'));
							if(parent.get('name')==='group'){
								parent.removeMember(movedShape);
							}
							else if(parent.get('name')==='duplicator'){
								var success = parent.removeMember(movedShape,true);
								if(!success){
									return false;
								}

							}

							currentNode.addChildNode(movedShape);
							this.modified(movedShape);

						}
						switch (mode) {
							case 'after':
								movedShape.getParentNode().setChildAfter(movedShape, relativeShape);
								break;
							case 'before':
								movedShape.getParentNode().setChildBefore(movedShape, relativeShape);
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

		modifyGeometry: function(data, modifiers) {
			if (selected.length > 0) {
				for (var i = 0; i < selected.length; i++) {
					var instance = selected[i];
					instance.setValue(data);
				}
			}
		},


		modifySegment: function(data, handle, modifiers) {
			var instances = selected.filter(function(item) {
				return item.get('name') != 'point';
			});
			if (instances.length > 0) {
				for (var i = 0; i < instances.length; i++) {
					var instance = instances[i];
					instance.modifyPoints(data, this.get('tool-mode'), this.get('tool-modifier'));
				}
			}
		},

		modifyParams: function(data) {
			if (selected.length > 0) {
				for (var i = 0; i < selected.length; i++) {
					selected[i].updateParams(data);
				}
			}
		},

		modifyStyle: function(style_data) {
			if (selected.length > 0) {
				for (var i = 0; i < selected.length; i++) {
					var instance = selected[i];
					instance.setValue(style_data);
				}
			}
		},


		/* toggleOpen
		 * returns children of opened function or members of opened lists
		 */
		toggleOpen: function() {
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