/*Collection Manager
 * manager that keeps track of all lists and duplicators
 */


define([
	'underscore',
	'backbone',
	'models/data/collections/ConstrainableList',
	'views/CollectionView',


], function(_, Backbone, ConstrainableList, CollectionView) {


	//stores para lists
	var lists,renderQueue;
	var collectionView;
	var compile = 1;
	var remove = 2;
	var search = 4;

	var CollectionManager = Backbone.Model.extend({
		defaults: {},

		initialize: function() {
			var collectionView = new CollectionView({
				el: '#collectionToolbar',
				model: this
			});
		},

		/* setters and getters for current lists
		 */
		setLists: function(l) {
			lists = l;
		},

		getLists: function() {
			return lists;
		},
		
		resetRenderQueue: function(){
			renderQueue = []
		},

		render: function(root) {
			for (var i = 0; i < renderQueue.length; i++) {
				renderQueue[i].render();

			}
		},
		/* getListByID
		 * returns list by id
		 */
		getCollectionById: function(id) {

			var state_data = {
				state: search,
				id: id
			};

			var match = false;
			for (var i = 0; i < lists.length; i++) {
				match = this.visit(lists[i], null, state_data);
				if (match) {
					return match;
				}
			}
			return false;
		},


		/*removeObjectFromLists
		 * called when object is being deletetd
		 * ensures a reference of it is no longer stored in the lists
		 */
		removeObjectFromLists: function(obj) {
			for (var j = 0; j < lists.length; j++) {
				lists[j].recRemoveMember(obj);
			}
		},

		/*removeCollection
		 * removes the reference to the collection and deletes it
		 * without deleting its members
		 */
		removeCollection: function(collection) {
			for (var j = 0; j < lists.length; j++) {
				if (lists[j] === collection) {
					lists.splice(j, 1);
					lists = lists.concat(collection.getListMembers());
					collection.removeAllMembers();
					break;
				} else {
					var removedItems = lists[j].recRemoveMember(collection);
					if (removedItems) {
						lists.push.apply(lists, removedItems);
					}
				}
			}
		},

		/* compileCollections
		 * method to begin rendering process of collections
		 * following rendering of all non-list items in the tree
		 * (calls visit on each member of listsToCompile array with render argument set
		 * to true
		 */
		compileCollections: function() {
			var state_data = {
				state: compile
			};
			for (var i = 0; i < lists.length; i++) {
				this.visit(lists[i], null, state_data);
			}
		},

		/* visit funciton for lists */
		visit: function(node, departure_node, state_data) {
			var member;
			var state = state_data.state;
			switch (state) {
				case compile:
					node.reset();
					node.compile();
					renderQueue.push(node);
					for (var i = 0; i < node.members.length; i++) {
						member = node.members[i];
						if (member.get('type') === 'collection') {
							member.visit(this, 'visit', node, state_data);
						}
					}
					break;
				case search:
					if (node.get('id') === state_data.id) {
						return node;
					} else {
						for (var l = 0; l < node.members.length; l++) {
							member = node.members[l];
							if (member.get('type') === 'collection') {
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

		/* filterSelection
		 * returns array of selected objects based on selected instances
		 * and state of lists which contain those objects(open vs closed)
		 */
		filterSelection: function(lInstance) {
			var sInstances = [];
			var itemFound = false;
			for (var i = 0; i < lists.length; i++) {
				var item = lists[i].getMember(lInstance);
				console.log('item', i, lInstance.get('id'), lInstance.get('name'), lists[i].toJSON().members);
				if (item && item != lInstance) {
					sInstances.push(item);
					itemFound = true;
				}
			}
			//add in originally selected index if no lists have been added
			if (itemFound) {
				return {
					toRemove: lInstance,
					toAdd: sInstances
				};
			}

		},

		//=======list heirarchy managment methods==========//

		/*addList
		 *adds a list to the closedlist array and removes any items
		 * on the array which are members of the added list
		 */
		addList: function(selected) {
			var list = new ConstrainableList();
			list.addMember(selected);
			if (!this.addToOpenLists(list)) {
				for (var i = lists.length - 1; i >= 0; i--) {
					if (list.hasMember(lists[i], true)) {
						lists.splice(i, 1);
					}
				}
				lists.push(list);
			}

			return list;
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

		toggleOpenLists: function(selected) {

			var openedLists = [];
			var openedItems = [];
			var members = [];
			for (var j = 0; j < selected.length; j++) {
				var item = selected[j];
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


		/* toggleClosedLists
		 * closes selected open lists
		 */
		toggleClosedLists: function(selected) {
			console.log('selected', selected);
			var toggledLists = [];
			var returnedLists = [];
			for (var j = 0; j < selected.length; j++) {
				var item = selected[j];
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
				toRemove: selected
			};
		},



		closeAllLists: function() {
			for (var i = 0; i < lists.length; i++) {
				lists[i].closeAllMembers();
				lists[i].set('open', false);
			}
		},






	});
	return CollectionManager;
});