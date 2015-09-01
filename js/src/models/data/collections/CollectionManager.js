/*Collection Manager
 * manager that keeps track of all lists and duplicators
 */


define([
	'underscore',
	'backbone',
	'models/data/collections/ConstrainableList',
	'models/data/collections/Duplicator',
		'models/data/geometry/Group'



], function(_, Backbone, ConstrainableList, Duplicator, Group) {


	//stores para lists
	var lists, renderQueue, duplicators;
	var collectionView;
	var remove = 2;
	var search = 4;

	var CollectionManager = Backbone.Model.extend({
		defaults: {},

		initialize: function() {},

		/* setters and getters for current lists
		 */
		setLists: function(l) {
			lists = l;
		},

		getLists: function() {
			return lists;
		},

		resetRenderQueue: function() {
			renderQueue = [];
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

		getDuplicatorThatContains: function(object) {
			var collections = this.getCollectionThatContains(object);
			var duplicators = collections.filter(function(item) {
				return item.get('name') == 'duplicator';
			});
			if (duplicators.length > 0) {
				if (duplicators.length > 1) {
					console.log('[ALERT]: object in more than one duplicator');
				}
				return duplicators[0];
			}
		},

		getListsThatContain: function(object) {
			var collections = this.getCollectionThatContains(object);
			var slists = collections.filter(function(item) {
				return item.get('name') == 'list';
			});
			if (slists.length > 0) {
				return slists;
			}

		},

		getCollectionThatContains: function(object) {
			var collections = [];
			for (var i = 0; i < lists.length; i++) {
				var contains = lists[i].hasMember(object, true);
				if (contains) {
					collections.push(contains);
				}
			}

			return collections;

		},


		/*removeObjectFromLists
		 * called when object is being deletetd
		 * ensures a reference of it is no longer stored in the lists
		 */
		removeObjectFromLists: function(obj) {
			for (var j = 0; j < lists.length; j++) {
				var r = lists[j].recRemoveMember(obj);
				if (r) {
					for (var i = 0; i < r.modified.length; i++) {
						this.trigger('listLengthChange', r.modified[i]);
					}
				}
			}
		},

		/*removeCollection
		 * removes the reference to the collection and deletes it
		 * without deleting its members
		 */
		removeCollection: function(collection) {
			var removedLists, members;
			for (var j = 0; j < lists.length; j++) {
				if (lists[j] === collection) {
					lists.splice(j, 1);
					members = collection.removeAllMembers();
					removedLists = members.filter(function(item) {
						return item.get('type') == 'collection';
					});

					lists.push.apply(lists, removedLists);

					break;
				} else {
					var removed_data = lists[j].recRemoveMember(collection);
					members = removed_data.orphans;
				}
			}

			collection.deleteSelf();

			return members;
		},

		/* visit funciton for lists */
		visit: function(node, departure_node, state_data) {
			var member;
			var state = state_data.state;
			switch (state) {
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
			console.log('checking list at ',i,lists[i].get('name'),item);

				if (item && item != lInstance) {
					console.log('list is closed');
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


		addDuplicator: function(object) {
			var duplicator = new Duplicator();

			duplicator.setTarget(object);

			if (!this.addToOpenLists(duplicator)) {
				for (var i = lists.length - 1; i >= 0; i--) {
					if (duplicator.hasMember(lists[i], true)) {
						lists.splice(i, 1);
					}
				}
				lists.push(duplicator);
			}

			return duplicator;
		},

		addGroup: function(selected) {
			var group = new Group();

			for(var j=0;j<selected.length;j++){
				group.addMember(selected[j]);
			}

			if (!this.addToOpenLists(group)) {
				for (var i = lists.length - 1; i >= 0; i--) {
					if (group.hasMember(lists[i], true)) {
						lists.splice(i, 1);
					}
				}
				lists.push(group);
			}

			return group;
		},


		/* addToOpenLists
		 * attempts to add a newly created instance to any open lists
		 */
		addToOpenLists: function(instance) {
			var addedToList = false;
			for (var i = 0; i < lists.length; i++) {
				var added = lists[i].addMemberToOpen(instance);
				if (added) {
					this.trigger('listLengthChange', lists[i]);
				}
				addedToList = addedToList ? true : added;
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
			this.closeAllLists();
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
			var toggledLists = [];
			var returnedLists = [];
			for (var j = 0; j < selected.length; j++) {
				var item = selected[j];
				for (var i = 0; i < lists.length; i++) {
					if ($.inArray(lists[i], toggledLists) === -1) {
						var r = lists[i].toggleClosed(item);
						console.log('checking toggle closed list',r,lists[i].get('name'));
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