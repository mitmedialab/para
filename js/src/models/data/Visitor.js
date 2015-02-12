/*Visitor.js
 * external tree visitor base implementation
 * used to traverse parse tree and build scenegraph of
 * instances for display to user
 */

define([
	'underscore',
	'backbone',
	'models/data/Instance'


], function(_, Backbone, Instance) {
	//datastructure to store path functions
	//TODO: make linked list eventually

	//stores para lists
	var closedLists = [];
	var openLists = [];
	var listsToRender = [];
	var store = 0;
	var compile = 1;
	var render = 2;

	var Visitor = Backbone.Model.extend({
		defaults: {},

		initialize: function() {},


		/*resetPrototypes
		 * resets the prototypes recursively.
		 * Called before visiting the root node
		 */
		resetPrototypes: function(prototypes) {
			for (var i = 0; i < prototypes.length; i++) {
				prototypes[i].reset();
				this.resetPrototypes(prototypes[i].children);
			}
			listsToRender = [];
		},

		/* getPrototypeById 
		 * returns prototype by id
		 */
		getPrototypeById: function(root, id) {
			var match = null;
			this.visitBfs(root, function(node) {
				if (node.get('type') === 'root') {
					return; // do not process roots
				}
				var pId = node.get('id');
				if (pId === id) {
					match = node;
					return node;
				}
			});
			return match;
		},

		/* computeLists
		 * method to begin rendering process of lists
		 * following rendering of all non-list items in the tree
		 * (calls visit on each member of listsToRender array with render argument set
		 * to true
		 */

		compileLists: function() {
			var state_data = {
				list: compile
			};
			for (var i = 0; i < listsToRender.length; i++) {
				this.visit(listsToRender[i], null, state_data);
			}
		},

		compileInstances: function(root) {
			var state_data = {
				list: store,
				instance: compile
			};
			//console.log('state_data_ compile instances',state_data);

			this.visit(root, null, state_data);
		},

		render: function(root) {
			var state_data = {
				list: render,
				instance: render
			};
			this.visit(root, null, state_data);
		},

		/*visit
		 * visitor method to walk the tree and compute and render each
		 * node on the screen according to type;
		 */
		visit: function(node, departureNode, state_data) {
			//console.log('state_data_ visit',state_data);

			node.set({
				visited: true
			});
			var rval;
			switch (node.get('type')) {
				case 'list':
					rval = this.visitList(node, departureNode, state_data);
					break;
				default:
					rval = this.visitInstance(node, departureNode, state_data);
					break;
			}
			return rval;
		},

		/*visitList
		 * visitor method for computing lists
		 * if render then computes the list's dimensions based on its members
		 * and draws it on the screen.
		 * otherwise, stashes the list in an array for rendering on a second pass.
		 * filters the array to ensure that it only contains lists with no parent list
		 */
		visitList: function(node, departureNode, state_data) {
			var data, member, ndata;
			var state = state_data.list;
			if (state === store) {
				
				listsToRender = listsToRender.filter(function(item) {
					return !node.hasMember(item, true);
				});
				listsToRender.push(node);
				for (var k = 0; k < node.children.length; k++) {
						node.children[k].visit(this, node, state_data);
				}
			} else if (state === compile) {
				node.compile(data);
				for (var i = 0; i < node.members.length; i++) {
					member = node.members[i];
					if (member.get('type') === 'list') {
						member.visit(this, node, state_data);
					}
				}
				return;
			} else if (state === render) {
				data = [];
				for (var j = 0; j < node.members.length; j++) {
					var d;
					member = node.members[j];
					if (member.get('type') === 'list') {
						d = member.visit(this, node, state_data);
					} else {
						d = member.get('geom');
					}
					data.push(d);
				}
				ndata = node.render(data);
				return ndata;
			}
		},

		/* visitInstance
		 * called for visit to instance node
		 * determines if node
		 */
		visitInstance: function(node, departureNode, state_data) {
			//console.log('state_data_ visit',state_data);

			var data = [];
			var ndata;
			var state = state_data.instance;
			var children = node.children;

			switch (state) {
				case compile:
					node.compile();
					for (var i = 0; i < children.length; i++) {
						children[i].visit(this, node, state_data);
					}
					break;
				case render:
					for (var j = 0; j < children.length; j++) {
						data.push(children[j].visit(this, node, state_data));
					}
					ndata = node.render(data);
					break;
			}

			return ndata;
		},


		//=======list heirarchy managment methods==========//

		/*addList
		 *adds a list to the closedlist array and removes any items
		 * on the array which are members of the added list
		 */
		addList: function(list) {
			for (var i = closedLists.length - 1; i >= 0; i--) {
				//console.log('checking list at ', i);
				if (list.hasMember(closedLists[i], true)) {
					closedLists.splice(i, 1);
					//console.log('removing closed list member at ', i);
				}
			}
			closedLists.push(list);
		},



		/*removeList
		 *removes list item recursively checking sublists
		 */
		removeList: function(list) {
			for (var i = 0; i < closedLists.length; i++) {
				closedLists[i].recRemoveMember(list);
			}
		},

		/* filterSelection
		 * returns array of selected objects based on selected instances
		 * and state of lists which contain those objects(open vs closed)
		 */
		filterSelection: function(lInstance) {
			var sInstances = [];
			var itemFound = false;
			for (var i = 0; i < closedLists.length; i++) {
				var item = closedLists[i].getMember(lInstance);
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

		/* openList
		 * sets list argument to
		 * open and pops it from the closedLists to the openLists array
		 * returns list that was opened
		 */
		openList: function(list) {
			var index = $.inArray(list, closedLists);
			if (index > -1) {
				closedLists.splice(index, 1);
				list.set('open', true);
				openLists.push(list);
				closedLists = list.members.concat(closedLists);
				return list;
			}
			return null;
		},

		/* closeParentList 
		 * closes the parent list of list argument (if it exists)
		 * along with any siblings or descendants of the argument
		 * and re-sets the open and closed lists accordingly
		 */
		closeParentList: function(list) {
			var index = $.inArray(list, closedLists);
			//console.log('list index', index);
			var instance;
			var parentLists = [];

			var removeFromClosed = [];
			var removeFromOpen = [];

			if (index > -1) {
				instance = closedLists[index];
			} else if (list.get('type') !== 'list') {
				//console.log('type is not list');
				instance = list;
			}
			if (instance) {
				//console.log('instance found');
				for (var i = openLists.length - 1; i >= 0; i--) {
					console.log('checking open list at', i);
					if (openLists[i].hasMember(instance, true)) {
						//	console.log('instance is member of open list at', i);
						var parentList = openLists[i];
						removeFromOpen.push(parentList);
						parentList.closeMembers();
						for (var j = closedLists.length - 1; j >= 0; j--) {
							if (parentList.hasMember(closedLists[j], true)) {
								removeFromClosed.push(closedLists[j]);
							}
						}
						parentList.set('open', false);
						parentLists.push(parentList);
					}
				}
				openLists = openLists.filter(function(item) {
					var isOpen = item.get('open');
					var index = $.inArray(item, removeFromOpen);
					return (index === -1 && isOpen);
				});
				closedLists = closedLists.filter(function(item) {
					var r = $.inArray(item, removeFromClosed);
					return r === -1;
				});

				closedLists = removeFromOpen.concat(closedLists);
			}
			return parentLists;
		},



	});

	return Visitor;


});