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
		},

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



		visitBfs: function(node, func) {
			var q = [node];
			while (q.length > 0) {
				node = q.shift();
				if (func) {
					func(node);
				}

				_.each(node.children, function(child) {
					q.push(child);
				});
			}
		},

		visitDfs: function(node, func) {
			if (func) {
				func(node);
			}

			_.each(node.children, function(child) {
				this.visitDfs(child, func);
			});
		},

		/*visit
		 *
		 */
		visit: function(node, departureNode) {
			node.set({
				visited: true
			});
			//check to see if node is root (has no departure)



			return this.visitInstance(node, departureNode);

		},

		visitChildren: function(node) {
			var children = node.children;
			var data = [];
			for (var i = 0; i < children.length; i++) {
				data.push(children[i].visit(this, node));
			}
			return data;
		},

		visitGeometry: function(node) {
			this.visitChildren();
		},

		visitPath: function(node) {

		},

		visitBlock: function(node) {
			var geometry = node.children[0].visit(this, node);
		},

		/* visitInstance
		 * called for visit to instance node
		 * determines if node
		 */
		visitInstance: function(node, departureNode) {
			var data = this.visitChildren(node);
			var ndata = node.render(data);
			return ndata;
		},

		//=======list heirarchy managment method==========//

		/*addList
		 *adds a list to the closedlist array and removes any items
		 * on the array which are members of the added list
		 */
		addList: function(list) {
			for (var i = closedLists.length - 1; i >= 0; i--) {
				console.log('checking list at ', i);
				if (list.hasMember(closedLists[i], true)) {
					closedLists.splice(i, 1);
					console.log('removing closed list member at ', i);
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

		/*filterSelection
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

		closeParentList: function(list) {
			var index = $.inArray(list, closedLists);
			console.log('list index', index);
			var instance;
			var parentLists = [];

			var removeFromClosed = [];
			var removeFromOpen = [];
		
			if (index > -1) {
				instance = closedLists[index];
			} else if (list.get('type') !== 'list') {
				console.log('type is not list');
				instance = list;
			}
			if (instance) {
				console.log('instance found');
				for (var i = openLists.length - 1; i >= 0; i--) {
					console.log('checking open list at', i);
					if (openLists[i].hasMember(instance, true)) {
						console.log('instance is member of open list at', i);
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
					var isOpen= item.get('open');
					var index =  $.inArray(item, removeFromOpen);
					return (index===-1 && isOpen);
				});
				closedLists = closedLists.filter(function(item){
					var r = $.inArray(item, removeFromClosed);
					return r===-1;
				});
				
				closedLists = removeFromOpen.concat(closedLists);
			}
			return parentLists;
		},



	});

	return Visitor;


});