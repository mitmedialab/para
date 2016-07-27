/*Collection Manager
 * manager that keeps track of all lists and duplicators - NOTE, need to refactor it so that duplicators are not managed here
 */


define([
	'underscore',
	'backbone',
	'models/data/collections/ConstrainableList',
	'models/data/collections/Duplicator',
	'utils/GeometryGenerator',
	'models/data/ConstraintManager'



], function(_, Backbone, ConstrainableList, Duplicator, GeometryGenerator, ConstraintManager) {


	//stores para lists
	var lists, renderQueue;
	var collectionView;
	var remove = 2;
	var search = 4;

	var CollectionManager = ConstraintManager.extend({

		initialize: function() {
			ConstraintManager.prototype.initialize.apply(this, arguments);
			this.set('id', "collection_manager");
			this.set('name', "collection_manager");

		},


		deleteAll: function() {
			this.clearUndoCache();
			return this.parseJSON([]);
		},

		clearUndoCache: function(){
			this.previousStates = [];
			this.futureStates = [];
			this.stateStored = false;

		},

		trimUndoStack:function(){
			this.previousStates.shift();
		},

		trimRedoStack: function(){
			this.futureStates.shift();
		},


		toJSON: function(noUndoCache) {
			var list_json = [];
			for (var i = 0; i < lists.length; i++) {
				var data = lists[i].toJSON(noUndoCache);
				data.index = i;
				list_json.push(data);
			}
			return list_json;
		},

		parseJSON: function(data, manager) {
			var changed = {
				toRemove: [],
				toAdd: []
			};
			var listClone = lists.slice(0, lists.length);
			var dataClone = data.slice(0, data.length);
			var self = this;
			for (var i = 0; i < lists.length; i++) {
				var target_id = lists[i].get('id');
				var target_data = _.find(data, function(item) {
					return item.id == target_id;
				});
				//if the child currently exists in the group
				if (target_data) {
					var mI = lists[i].parseJSON(target_data, manager);
					changed.toRemove.push.apply(changed, mI.toRemove);
					changed.toAdd.push.apply(changed, mI.toAdd);
					listClone = _.filter(listClone, function(list) {
						return list.get('id') != target_id;
					});
					dataClone = _.filter(dataClone, function(data) {
						return data.id != target_id;
					});
				}
			}

			
			//remove children not in JSON
			for (var j = 0; j < listClone.length; j++) {

				var currentFuture = this.futureStates[this.futureStates.length - 1];
				var currentPast = this.previousStates[this.previousStates.length - 1];

				if (currentFuture) {
					var targetFuture = _.find(currentFuture, function(item) {
						return item.id == listClone[j].get('id');
					});
					if (targetFuture) {
						targetFuture.futureStates = listClone[j].futureStates;
						targetFuture.previousStates = listClone[j].previousStates;
					}
				}
				if (currentPast) {
					var targetPast = _.find(currentPast, function(item) {
						return item.id == listClone[j].get('id');
					});
					if (targetPast) {
						targetPast.futureStates = listClone[j].futureStates;
						targetPast.previousStates = listClone[j].previousStates;
					}
				}

				var members = this.removeCollection(listClone[j]);
				members.forEach(function(member) {
					if (member.get('type') == 'collection') {
						self.insertList(member.previousStates[member.previousStates.length - 1].index, member);
					}
				});

				changed.toRemove.push(listClone[j]);
			}

			//addChildren in JSON that didn't already exist
			for (var k = 0; k < dataClone.length; k++) {
				var newList;
				newList = new ConstrainableList();
				changed.toAdd.push(newList);
				newList.parseJSON(dataClone[k], manager);
				newList.previousStates = dataClone[k].previousStates;
				newList.futureStates = dataClone[k].futureStates;
				this.insertList(dataClone[k].index, newList);
			}
			return changed;

		},


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

	

		/* visit funciton for lists */
		visit: function(node, departure_node, state_data) {
			var member;
			var state = state_data.state;
			switch (state) {
				case search:
					if (node.get('id') === state_data.id) {
						return node;
					} else {
						var types;
						if (node.members) {
							types = node.members;
						} else {
							types = node.children;
						}
						for (var l = 0; l < types.length; l++) {
							member = types[l];
							if (member.get('type') === 'collection') {
								var match = types[l].visit(this, 'visit', node, state_data);
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
			var item;
			for (var i = 0; i < lists.length; i++) {
				if (lists[i].get('type') == 'collection') {
					item = lists[i].getMember(lInstance);
				} else {
					item = lists[i].getChild(lInstance);
				}

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

		/*initializeList
		 *adds a list to the closedlist array and removes any items
		 * on the array which are members of the added list
		 */
		initializeList: function(selected, registerUndo) {

			var list = new ConstrainableList();
			var reference_list = new ConstrainableList();

			list.addMember(selected);

			var constraint = list.setInternalConstraint(reference_list);
			if (!constraint) {
				return null;
			}

			this.insertList(lists.length, list, registerUndo);
			return list;
		},

		addMultipleLists: function(lists,registerUndo){
			if (registerUndo) {
				this.addToUndoStack();
			}
			for(var i=0;i<lists.length;i++){
				this.addList(lists[i]);
			}
		},

		addList: function(list, registerUndo) {
			this.insertList(lists.length, list, registerUndo);
		},

		insertList: function(index, list, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();
			}
			if (!this.addToOpenLists(list)) {
				for (var i = lists.length - 1; i >= 0; i--) {
					if (list.hasMember(lists[i], true)) {
						lists.splice(i, 1);
					}
				}
			}
			lists.splice(index, 0, list);
		},

			/*removeCollection
		 * removes the reference to the collection and deletes it
		 * without deleting its members
		 */
		removeCollection: function(collection, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();
			}
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


		
	
		toggleOpen: function(item) {
			var openedLists = [];
			var openedItems = [];
			var members = [];

			for (var i = 0; i < lists.length; i++) {
				if ($.inArray(lists[i], openedLists) === -1) {
					var r = lists[i].toggleOpen(item);
					if (r) {
						openedItems = openedItems.concat(r);
						openedLists.push(lists[i]);
					} else {
						lists[i].toggleClosed(lists[i]);
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


		/* toggleClosed
		 * closes selected open lists
		 */
		toggleClosed: function(item) {
			var toggledLists = [];
			var returnedLists = [];
			for (var i = 0; i < lists.length; i++) {
				if ($.inArray(lists[i], toggledLists) === -1) {
					var r = lists[i].toggleClosed(item);
					if (r) {
						returnedLists = returnedLists.concat(r);
						toggledLists.push(lists[i]);
					}
				}

			}
			return {
				toSelect: returnedLists,
				toRemove: [item]
			};
		},



		closeAllLists: function() {
			for (var i = 0; i < lists.length; i++) {
				lists[i].closeAllMembers();
				lists[i].set('open', false);
			}
		},



		getListJSON: function() {
			var list_json = [];
			for (var i = 0; i < lists.length; i++) {
				if (lists[i].get('name') !== 'duplicator') {
					list_json.push(lists[i].toJSON());
				}
			}
			return list_json;
		},





	});
	return CollectionManager;
});