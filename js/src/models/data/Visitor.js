/*Visitor.js
 * external tree visitor base implementation
 * used to traverse parse tree and build scenegraph of
 * instances for display to user
 */

define([
	'underscore',
	'backbone',
	'models/data/Instance',
	'models/data/functions/FunctionNode',
	'models/data/functions/FunctionManager',
	'models/data/ConstrainableList', //TODO: create list manager
	'views/drawing/LayersView',


], function(_, Backbone, Instance, FunctionNode, FunctionManager, ConstrainableList, LayersView) {
	//datastructure to store path functions
	//TODO: make linked list eventually

	//stores para lists
	var lists;
	var renderQueue = [];
	var constraints = [];
	var store = 0;
	var compile = 1;
	var render = 2;
	var visit = 3;
	var search = 4;

var constraintPropMap = {
    'position': 'translation_delta',
    'scale': 'scaling_delta',
    'rotation': 'rotation_delta',
    'fill': 'fill_color',
    'stroke': 'stroke_color'
  };
	var rootNode, currentNode, layersView, functionManager;
	var Visitor = Backbone.Model.extend({
		defaults: {},

		initialize: function() {
			//setup root node
			rootNode = new FunctionNode();
			rootNode.open();
			lists = rootNode.lists;
			rootNode.set('name', 'root');
			this.listenTo(rootNode, 'parseJSON', this.parseJSON);
			currentNode = rootNode;
			functionManager = new FunctionManager();
			layersView = new LayersView({
				el: '#layers-constraints-container',
				model: this
			});
			this.listenTo(layersView,'deleteConstraint',this.removeConstraint);

		},
		setSelectTool: function(st) {
			functionManager.selectTool = st;
		},

		/*resetPrototypes
		 * resets the prototypes recursively.
		 * Called before visiting the root node
		 */
		resetPrototypes: function() {

			//for (var i = 0; i < renderQueue.length; i++) {
			//renderQueue[i].reset();
			//}
			renderQueue = [];
		},

		/* getPrototypeById 
		 * returns prototype by id
		 */
		getPrototypeById: function(id, start) {
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

		getConstraintById: function(id){
				var constraint = constraints.filter(function(constraint){
				return constraint.id === id;
			})[0];
			console.log('getting constraint by id',constraint);
			return constraint;
		},


		/* getPrototypeById 
		 * returns prototype by id
		 */
		getListById: function(id) {
		
			var state_data = {
				list: search,
				instance: search,
				func: search,
				data: id
			};
			console.log('getListByID',state_data.list,state_data);
			var match = false;
			for (var i = 0; i < lists.length; i++) {
				console.log('checking list at ',i,lists[i]);
				match = this.visitList(lists[i], null, state_data);
				if (match) {
					return match;
				}
			}
			return false;
		},



		compile: function() {

			this.resetPrototypes();
			this.compileFunctions();
			this.compileInstances();
			this.compileLists();
			this.render();

		},
		/* computeLists
		 * method to begin rendering process of lists
		 * following rendering of all non-list items in the tree
		 * (calls visit on each member of listsToCompile array with render argument set
		 * to true
		 */

		compileLists: function() {
			var state_data = {
				list: compile
			};
			for (var i = 0; i < lists.length; i++) {
				this.visit(lists[i], null, state_data);
			}
		},

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

		compileInstances: function() {

			var state_data = {
				list: store,
				instance: compile,
				func: compile,
			};

			this.visit(currentNode, null, state_data);

		},

		render: function(root) {
			_.sortBy(renderQueue, function(item) {
				return item.get('order');
			});
			for (var i = 0; i < renderQueue.length; i++) {
				renderQueue[i].render();

			}
		},


		removeShape: function(selected_shapes) {
			for (var i = 0; i < selected_shapes.length; i++) {
				this.removeInstance(null, null, selected_shapes[i]);
			}
		},

		removeInstance: function(node, departureNode, target) {
			if (!node) {
				node = currentNode;
			}
			if (node === target) {
				node.deleteSelf();
				layersView.removeShape(node.get('id'));
				for (var j = 0; j < lists.length; j++) {
					if (lists[j] === node) {
						lists.splice(j, 1);
						lists = lists.concat(node.getListMembers());
						node.removeAllMembers();
						break;
					}
				}
				if (departureNode) {
					departureNode.removeInheritor(node);
					departureNode.removeChildNode(node);

				}

			} else {
				for (var i = 0; i < node.children.length; i++) {
					node.children[i].visit(this, 'removeInstance', node, target);
				}
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
				case 'list':
					return this.visitList(node, departureNode, state_data);

				case 'function':
					return this.visitFunction(node, departureNode, state_data);

				default:
					return this.visitInstance(node, departureNode, state_data);

			}

		},


		/*visitList- THIS IS SLOW- SPEED IT UP
		 * visitor method for computing lists
		 * if render then computes the list's dimensions based on its members
		 * and draws it on the screen.
		 * otherwise, stashes the list in an array for rendering on a second pass.
		 * filters the array to ensure that it only contains lists with no parent list
		 */
		visitList: function(node, departureNode, state_data) {
			var member;
			var state = state_data.list;
			console.log('visiting list',state_data.list,state_data);
			switch (state) {
				case store:
					for (var k = 0; k < node.children.length; k++) {
						node.children[k].visit(this, 'visit', node, state_data);
					}
					break;
				case compile:
					node.reset();
					node.compile();
					renderQueue.push(node);
					var s_d = {
						list: visit
					};
					for (var i = 0; i < node.members.length; i++) {
						member = node.members[i];
						if (member.get('type') === 'list') {
							member.visit(this, 'visit', node, s_d);
						}
					}
					break;
				case visit:
					renderQueue.push(node);
					for (var j = 0; j < node.members.length; j++) {
						member = node.members[j];
						if (member.get('type') === 'list') {
							member.visit(this, 'visit', node, state_data);
						}
					}
					break;
				case search:
					console.log('searching list',state_data.data,node.get('id'),state_data.data===node.get('id'));
					if (node.get('id') === state_data.data) {
						console.log('match found');
						return node;
					} else {
						for (var l = 0; l < node.members.length; l++) {
							member = node.members[j];
							if (member.get('type') === 'list') {
								var match = node.members[l].visit(this, 'visit', node, state_data);
								if (match) {
									return match;
								}
							}
						}
					}
					break;

			}

			return;

		},

		/* visitFunction
		 * called for visit to function node
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
		 * called for visit to instance node
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
					node.set('order', dIndex + node.getIndex());
					renderQueue.push(node);
					for (var i = 0; i < children.length; i++) {
						children[i].visit(this, 'visit', node, state_data);
					}
					break;
				case search:
					console.log('searching instance', state_data.data);

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
		addFunction: function(selected_shapes) {
			lists = lists.filter(function(item) {
				console.log('removing list from current list tracker');
				return selected_shapes.indexOf(item) === -1;
			});
			functionManager.createFunction('my_function', selected_shapes);
			this.compile();
		},

		createParams: function(selected_shapes) {
			for (var i = 0; i < selected_shapes.length; i++) {
				functionManager.addParamToFunction(currentNode, selected_shapes[i]);
			}
			this.compile();
		},

		addShape: function(shape) {

			if (!shape.parentNode) {
				currentNode.addChildNode(shape);
			}
			this.addToOpenLists(shape);
			if (shape.get('name') !== 'ui-item' && shape.get('name') !== 'ui') {
				layersView.addShape(shape.toJSON());
			}
			this.compile();
		},

		//called when creating an instance which inherits from existing shape
		addInstance: function(parent) {
			console.log('visitor add instance');
			var newInstance = parent.create();
			parent.set('selected', false);
			newInstance.set('selected', true);
			layersView.addInstance(newInstance.toJSON(), parent.get('id'));
			this.selectShape(newInstance);
			return newInstance;
		},


		addConstraint: function(constraint){
			constraints.push(constraint);
			layersView.addConstraint(constraint);

		},

		removeConstraint: function(id){
			var constraint = this.getConstraintById(id);
			if(constraint){
				console.log('constraint found, trying to remove', constraint);
				var reference = this.getPrototypeById(constraint.reference);
				if(!reference){
					reference = this.getListByID(constraint.reference);
				}
				var relative = this.getPrototypeById(constraint.relative);
				if(!relative){
					relative = this.getListByID(constraint.relative);
				}
				relative.get(constraint.rel_prop_key).removeConstraint(constraint.rel_prop_dimensions);
				layersView.removeConstraint(constraint.id);
			}
		},

		reorderShapes: function(movedId, relativeId, mode) {
			console.log('reorder shapes', movedId, relativeId, mode);
			var movedShape = this.getPrototypeById(movedId);
			var relativeShape = this.getPrototypeById(relativeId);
			console.log('shape=', movedShape, relativeShape);
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

		selectShape: function(shape) {
			if(typeof shape === 'string'){
				var selected = this.getPrototypeById(shape);
				this.trigger('selectionFiltered', selected, []);
			}
			else{
			this.trigger('selectionFiltered', shape, []);

			}
			

		},

		deselectShape: function(shape) {
			if(typeof shape === 'string'){
				var selected = this.getPrototypeById(shape);
				this.trigger('selectionFiltered', [], selected);
			}
			else{
				this.trigger('selectionFiltered', [], shape);
			}
		},

		hideShape: function(shape) {
			if(typeof shape === 'string'){
				var selected = this.getPrototypeById(shape);
				selected.hide();
				this.trigger('selectionFiltered', [], selected);
			}
			else{
				shape.hide();
				this.trigger('selectionFiltered', [], shape);
			}
		},

		showShape: function(shape) {
			if(typeof shape === 'string'){
				var selected = this.getPrototypeById(shape);
				selected.show();
			}
			else{
				shape.show();
				this.trigger('selectionFiltered', [], shape);
			}
		},

		selectionChanged: function(selected_shapes, added_shape) {
			var filtered = false;
			if (selected_shapes.length > 0) {
				if (added_shape) {
					if (added_shape.get('name') != 'point') {
						filtered = this.filterSelection(added_shape);
					}
				}
			}

			if (!filtered) {
				this.compile();
			}

			var layer_shapes = selected_shapes.map(function(item){
				if(item.get('name')==='point'){
					return item.nodeParent;
				}
				else{
					return item;
				}
			});
			
			layersView.updateSelection(layer_shapes);


		},

		/* filterSelection
		 * returns array of selected objects based on selected instances
		 * and state of lists which contain those objects(open vs closed)
		 */
		filterSelection: function(lInstance) {
			var sInstances = [];
			var itemFound = false;
			console.log('total num lists', lists.length);
			for (var i = 0; i < lists.length; i++) {
				var item = lists[i].getMember(lInstance);
				console.log('item', i, lInstance.get('id'), lInstance.get('name'), lists[i].toJSON().members);
				if (item) {
					sInstances.push(item);
					itemFound = true;
				}
			}
			//add in originally selected index if no lists have been added
			if (itemFound) {
				this.trigger('selectionFiltered', sInstances, lInstance);
				return true;
			}
			return false;

		},

	

		//=======list heirarchy managment methods==========//

		/*addList
		 *adds a list to the closedlist array and removes any items
		 * on the array which are members of the added list
		 */
		addList: function(selectedShapes) {
			var list = new ConstrainableList();
			list.addMember(selectedShapes);
			if (!this.addToOpenLists(list)) {
				for (var i = lists.length - 1; i >= 0; i--) {
					if (list.hasMember(lists[i], true)) {
						lists.splice(i, 1);
					}
				}
				lists.push(list);
			}

			layersView.addList(list.toJSON());
			this.trigger('selectionFiltered', list, selectedShapes);
		},

		/* addToOpenLists
		 * attempts to add a newly created instance to any open lists
		 */
		addToOpenLists: function(instance) {
			var addedToList = false;
			for (var i = 0; i < lists.length; i++) {
				addedToList = addedToList ? true : lists[i].addMemberToOpen(instance);
			}
			return addedToList;
		},

		/*removeList
		 *removes list item recursively checking sublists
		 */
		removeList: function(list) {
			for (var i = 0; i < lists.length; i++) {
				lists[i].recRemoveMember(list);

			}
		},



		/* toggleOpen
		 * returns children of opened function or members of opened lists
		 */
		toggleOpen: function(items) {
			var data;
			var functions = items.filter(function(item) {
				return item.get('type') === 'function';
			});
			if (functions.length > 0) {
				this.closeAllLists();
				data = functionManager.toggleOpenFunctions(currentNode, functions[functions.length - 1]);
				lists = data.lists;
				currentNode = data.currentNode;
			} else {
				data = this.toggleOpenLists(items);
			}
			console.log('toggleOpen', data.toSelect, data.toRemove);
			this.trigger('selectionFiltered', data.toSelect, data.toRemove);

		},

		/* toggleClosed
		 * closes open functions or selected open lists
		 */
		toggleClosed: function(items) {
			//TODO: fix this so it closes selected open lists first...
			var data;
			var lists = items.filter(function(item) {
				return (item.get('type') === 'list');
			});
			if (lists.length > 0) {
				data = this.toggleClosedLists(items);
			} else {
				this.closeAllLists();
				data = functionManager.toggleClosedFunctions(currentNode, rootNode);
				currentNode = data.currentNode;
				lists = currentNode.lists;
			}
			this.trigger('selectionFiltered', data.toSelect, data.toRemove);

		},

		/* toggleClosedLists
		 * closes selected open lists
		 */
		toggleClosedLists: function(items) {
			var toggledLists = [];
			var returnedLists = [];
			for (var j = 0; j < items.length; j++) {
				var item = items[j];
				for (var i = 0; i < lists.length; i++) {
					if ($.inArray(lists[i], toggledLists) === -1) {
						var r = lists[i].toggleClosed(item);
						if (r) {
							returnedLists = returnedLists.concat(r);
							toggledLists.push(lists[i]);
						}
					}
				}
			}
			return {
				toSelect: returnedLists,
				toRemove: items
			};
		},

		closeAllLists: function() {
			for (var i = 0; i < lists.length; i++) {
				lists[i].closeAllMembers();
				lists[i].set('open', false);
			}
		},


		toggleOpenLists: function(items) {

			var openedLists = [];
			var openedItems = [];
			var members = [];
			for (var j = 0; j < items.length; j++) {
				var item = items[j];
				for (var i = 0; i < lists.length; i++) {
					if ($.inArray(lists[i], openedLists) === -1) {
						var r = lists[i].toggleOpen(item);
						if (r) {
							openedItems = openedItems.concat(r);
							openedLists.push(lists[i]);
						}

					}
				}
			}
			for (var k = 0; k < openedItems.length; k++) {
				members = members.concat(openedLists[k].members);

			}
			return {
				toSelect: members,
				toRemove: openedLists
			};
		},



	});

	return Visitor;


});
