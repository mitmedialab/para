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
	var lists = [];
	var openLists = [];
	var renderQueue = [];
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
			/*for (var i = 0; i < prototypes.length; i++) {
				prototypes[i].reset();
				this.resetPrototypes(prototypes[i].children);
			}*/
			for (var i = 0; i < renderQueue.length; i++) {
				renderQueue[i].reset();
			}
			renderQueue = [];
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

		compileInstances: function(root) {
			var state_data = {
				list: store,
				instance: compile
			};
			//console.log('state_data_ compile instances',state_data);

			this.visit(root, null, state_data);
		},

		render: function(root) {
			for (var i = 0; i < renderQueue.length; i++) {
				
				renderQueue[i].render();
				
			}
		},


		removeInstance: function(node,departureNode,target){
			if(node===target){
				node.deleteSelf();
				for(var j=0;j<lists.length;j++){
					if(lists[j]===node){
						lists.splice(j,1);
						lists = lists.concat(node.getListMembers());
						node.removeAllMembers();
						break;
					}
					else{
						lists[j].recRemoveMember(target);
					}
				}
				if(departureNode){
					departureNode.removeChildNode(node);
				}

			}
			else{
				for(var i=0;i<node.children.length;i++){
					node.children[i].visit(this,'removeInstance',node,target);
				}
			}
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
			switch (node.get('type')) {
				case 'list':
				case 'sampler':
					this.visitList(node, departureNode, state_data);
					break;
				default:
					this.visitInstance(node, departureNode, state_data);
					break;
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
			if (state === store) {
				for (var k = 0; k < node.children.length; k++) {
					node.children[k].visit(this, 'visit', node, state_data);
				}
			} else if (state === compile) {
				node.compile();
				renderQueue.push(node);
				for (var i = 0; i < node.members.length; i++) {
					member = node.members[i];
					if (member.get('type') === 'list') {
						member.visit(this, 'visit',node, state_data);
					}
				}
				return;
			}
		},

		/* visitInstance
		 * called for visit to instance node
		 * determines if node
		 */
		visitInstance: function(node, departureNode, state_data) {
			//console.log('state_data_ visit',state_data);

			var state = state_data.instance;
			var children = node.children;

			switch (state) {
				case compile:
					node.compile();
					renderQueue.push(node);
					for (var i = 0; i < children.length; i++) {
						children[i].visit(this, 'visit',node, state_data);
					}
					break;
			}


		},


		//=======list heirarchy managment methods==========//

		/*addList
		 *adds a list to the closedlist array and removes any items
		 * on the array which are members of the added list
		 */
		addList: function(list) {
		
			if (!this.addToOpenLists(list)) {
				for (var i = lists.length - 1; i >= 0; i--) {
					//console.log('checking list at ', i);
					if (list.hasMember(lists[i], true)) {
						lists.splice(i, 1);
						//console.log('removing closed list member at ', i);
					}
				}
				lists.push(list);
			}
			for (var j = lists.length - 1; j >= 0; j--) {
				lists[j].printMembers();
			}

		},

		/* addToOpenLists
		 * attempts to add a newly created instance to any open lists
		 */
		addToOpenLists: function(instance) {
			var addedToList = false;
			for (var i = 0; i < lists.length; i++) {
				addedToList = addedToList ? true : lists[i].addMemberToOpen(instance);
			}
			console.log('added to list from visitor', addedToList);
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

		/* openList
		 * sets list argument to
		 * open and pops it from the lists to the openLists array
		 * returns list that was opened
		 */
		toggleOpen: function(items) {
			var openedLists = [];
			var returnedLists = [];
			for (var j = 0; j < items.length; j++) {
				var item = items[j];
				for (var i = 0; i < lists.length; i++) {
					if ($.inArray(lists[i], openedLists) === -1) {
						var r = lists[i].toggleOpen(item);
						if (r) {
							returnedLists = returnedLists.concat(r);
							openedLists.push(lists[i]);
						}

					}
				}
			}
			return returnedLists;
		},

		toggleClosed: function(items) {
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



	});

	return Visitor;


});