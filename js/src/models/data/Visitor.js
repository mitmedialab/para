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
	'views/drawing/LayersView'


], function(_, Backbone, Instance, FunctionNode, FunctionManager, LayersView) {
	//datastructure to store path functions
	//TODO: make linked list eventually

	//stores para lists
	var lists;
	var renderQueue = [];
	var store = 0;
	var compile = 1;
	var render = 2;
	var visit = 3;
	var search = 4;


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
		getPrototypeById: function(root, id) {
			var state_data = {
				list: search,
				instance: search,
				func: search,
				data: id
			};
			var match = this.visit(root, null, state_data);
			return match;
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



		removeInstance: function(node, departureNode, target) {
			if (!node) {
				node = currentNode;
			}
			if (node === target) {


				node.deleteSelf();
				for (var j = 0; j < lists.length; j++) {
					if (lists[j] === node) {
						lists.splice(j, 1);
						lists = lists.concat(node.getListMembers());
						node.removeAllMembers();
						break;
					}
				}
				if (departureNode) {
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
				case 'sampler':
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
						if (member.get('type') === 'list' || member.get('type') === 'sampler') {
							member.visit(this, 'visit', node, s_d);
						}
					}
					break;
				case visit:
					renderQueue.push(node);
					for (var j = 0; j < node.members.length; j++) {
						member = node.members[j];
						if (member.get('type') === 'list' || member.get('type') === 'sampler') {
							member.visit(this, 'visit', node, state_data);
						}
					}
					break;
				case search:
					if (node.get('id') == state_data.data) {
						return node;
					} else {
						for (var l = 0; l < node.members.length; l++) {
							var match = node.members[l].visit(this, 'visit', node, state_data);
							if (match) {
								return match;
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

					console.log('node id', node.get('id'));
					if (node.get('id') === state_data.data) {
						console.log('found match!');
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
		},

		createParams: function(selected_shapes) {
			for (var i = 0; i < selected_shapes.length; i++) {
				functionManager.addParamToFunction(currentNode, selected_shapes[i]);
			}
		},

		addShape: function(instance, parent) {
			if (instance) {
				if (parent) {
					parent.addChildNode(instance);
				} else {
					currentNode.addChildNode(instance);
					this.addToOpenLists(instance);
				}

			}
			if(instance.get('name')!=='ui-item' && instance.get('name')!=='ui'){
				layersView.addShape(instance.toJSON());

			}
		},

		

		addConstraint: function(constraint_data) {
			layersView.addConstraint(constraint_data);
		},

		reorderShapes: function(movedId, relativeId, mode) {
			console.log('reorder shapes', movedId, relativeId, mode);
			var movedShape = this.getPrototypeById(rootNode, movedId);
			var relativeShape = this.getPrototypeById(rootNode, relativeId);
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

		toggleShapeVisibility: function(shapeId) {
			var shape = this.getPrototypeById(rootNode, shapeId);
			console.log('toggling visible', shapeId, shape);
			if (shape) {
				shape.set('visible', !shape.get('visible'));
				shape.set('selected', false);
				this.compile();
			}
		},

		//called when creating an instance which inherits from existing shape
		addInstance: function(parent) {
			var newInstance = parent.create();
			parent.set('selected', false);
			newInstance.set('selected', true);
			layersView.addInstance(newInstance.toJSON(), parent.get('id'));
			return newInstance;
		},

		//=======list heirarchy managment methods==========//

		/*addList
		 *adds a list to the closedlist array and removes any items
		 * on the array which are members of the added list
		 */
		addList: function(list) {

			if (!this.addToOpenLists(list)) {
				for (var i = lists.length - 1; i >= 0; i--) {
					if (list.hasMember(lists[i], true)) {
						lists.splice(i, 1);
					}
				}
				lists.push(list);
			}

			layersView.addList(list.toJSON());

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

		/* filterSelection
		 * returns array of selected objects based on selected instances
		 * and state of lists which contain those objects(open vs closed)
		 */
		filterSelection: function(lInstance) {
			var sInstances = [];
			var itemFound = false;
			for (var i = 0; i < lists.length; i++) {
				var item = lists[i].getMember(lInstance);

				if (item) {
					sInstances.push(item);
					itemFound = true;
				}
			}
			//add in originally selected index if no lists have been added
			if (!itemFound) {
				sInstances.push(lInstance);
			}
			return sInstances;
		},

		/* toggleItems
		 * toggles item funcitonality according to item type
		 */
		toggleItems: function(items) {
			var lastSelected = items[items.length - 1];
			switch (lastSelected.get('type')) {
				case 'function':
					functionManager.callFunction(lastSelected);
					break;
				default:
					break;
			}
		},

		/* toggleOpen
		 * returns children of opened function or members of opened lists
		 */
		toggleOpen: function(items) {
			var functions = items.filter(function(item) {
				return item.get('type') === 'function';
			});
			if (functions.length > 0) {
				this.closeAllLists();
				var data = functionManager.toggleOpenFunctions(currentNode, functions[functions.length - 1]);
				lists = data.lists;
				currentNode = data.currentNode;
				return data.toSelect;
			} else {
				return this.toggleOpenLists(items);
			}
		},

		/* toggleClosed
		 * closes open functions or selected open lists
		 */
		toggleClosed: function(items) {
			//TODO: fix this so it closes selected open lists first...
			var lists = items.filter(function(item) {
				return (item.get('type') === 'list' || item.get('type') === 'sampler');
			});
			if (lists.length > 0) {
				return this.toggleClosedLists(items);
			} else {
				this.closeAllLists();
				var data = functionManager.toggleClosedFunctions(currentNode, rootNode);
				currentNode = data.currentNode;
				lists = currentNode.lists;
				return data.toSelect;
			}
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
			return returnedLists;
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
			return members;
		},



	});

	return Visitor;


});