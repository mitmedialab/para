/*ConstraintManager.js
 * manager for all constraints 
 *  stores state for undo/redo
 */

define([
	'underscore',
	'backbone',
	'models/data/Constraint',



], function(_, Backbone, Constraint) {

	var ConstraintManager = Backbone.Model.extend({

		initialize: function() {
			this.constraints = [];

			//undo redo variables
			this.previousStates = [];
			this.futureStates = [];
			this.stateStored = false;
			this.set('id', "constraint_manager");
			this.set('name', "constraint_manager");
		},

		deleteAll: function(manager){
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


		//undo to last state
		undo: function(manager) {

			if (this.previousStates.length > 0) {
				var toRemove = [];
				var toAdd = [];

				var state = this.previousStates.pop();
				var currentState = this.toJSON();
				this.futureStates.push(currentState);
				var changed = this.parseJSON(state, manager);
				toRemove.push.apply(toRemove, changed.toRemove);
				toAdd.push.apply(toAdd, changed.toAdd);
				return {
					toRemove: toRemove,
					toAdd: toAdd
				};

			}
		},

		redo: function(manager) {
			if (this.futureStates.length > 0) {
				var toRemove = [];
				var toAdd = [];
				var state = this.futureStates.pop();
				var currentState = this.toJSON();
				this.previousStates.push(currentState);
				var changed = this.parseJSON(state, manager);
				toRemove.push.apply(toRemove, changed.toRemove);
				toAdd.push.apply(toAdd, changed.toAdd);
				return {
					toRemove: toRemove,
					toAdd: toAdd
				};
			}

		},

		addToUndoStack: function() {
			if (!this.stateStored) {
				this.previousStates.push(this.toJSON());
				this.stateStored = true;
				this.futureStates = [];
			}
		},

		/*setValueEnded
		 * called when a manual adujstment is ended
		 * such as on a mouse up event
		 * sets stateStored to false, enabling the next
		 * state of an object to be saved
		 */
		setValueEnded: function() {
			this.stateStored = false;
		},

		toJSON: function(noUndoCache) {
			var constraint_json = [];
			for (var i = 0; i < this.constraints.length; i++) {
				var data = this.constraints[i].toJSON(noUndoCache);
				data.index = i;
				constraint_json.push(data);
			}
			return constraint_json;
		},

		parseJSON: function(data, manager) {
			var changed = {
				toRemove: [],
				toAdd: []
			};
			var constraintClone = this.constraints.slice(0, this.constraints.length);
			var dataClone = data.slice(0, data.length);

			for (var i = 0; i < this.constraints.length; i++) {
				var target_id = this.constraints[i].get('id');
				var target_data = _.find(data, function(item) {
					return item.id == target_id;
				});
				//if the child currently exists in the group
				if (target_data) {
					var mI = this.constraints[i].parseJSON(target_data, manager);
					changed.toRemove.push.apply(changed, mI.toRemove);
					changed.toAdd.push.apply(changed, mI.toAdd);
					constraintClone = _.filter(constraintClone, function(constraint) {
						return constraint.get('id') != target_id;
					});
					dataClone = _.filter(dataClone, function(data) {
						return data.id != target_id;
					});
				}
			}


			//remove children not in JSON
			for (var j = 0; j < constraintClone.length; j++) {

				var currentFuture = this.futureStates[this.futureStates.length - 1];
				var currentPast = this.previousStates[this.previousStates.length - 1];

				if (currentFuture) {
					var targetFuture = _.find(currentFuture, function(item) {
						return item.id == constraintClone[j].get('id');
					});
					if (targetFuture) {
						targetFuture.futureStates = constraintClone[j].futureStates;
						targetFuture.previousStates = constraintClone[j].previousStates;
					}
				}
				if (currentPast) {
					var targetPast = _.find(currentPast, function(item) {
						return item.id == constraintClone[j].get('id');
					});
					if (targetPast) {
						targetPast.futureStates = constraintClone[j].futureStates;
						targetPast.previousStates = constraintClone[j].previousStates;
					}
				}

				var removed = this.removeConstraint(constraintClone[j].get('id'));
				changed.toRemove.push(removed);
			}

			//addChildren in JSON that didn't already exist
			for (var k = 0; k < dataClone.length; k++) {
				var newConstraint = new Constraint();
				changed.toAdd.push(newConstraint);

				newConstraint.parseJSON(dataClone[k], manager);
				newConstraint.previousStates = dataClone[k].previousStates;
				newConstraint.futureStates = dataClone[k].futureStates;
				this.insertConstraint(dataClone[k].index, newConstraint);

			}
			return changed;

		},

		getConstraintById: function(id) {
			var constraint = this.constraints.filter(function(constraint) {
				return constraint.get('id') === id;
			})[0];
			return constraint;
		},

		getConstraintsByRelative: function(relative) {
			var rel_constraints = this.constraints.filter(function(constraint) {
				return constraint.get('relatives') === relative;
			});
			return rel_constraints;
		},

		getConstraintsByReference: function(reference) {
			var ref_constraints = this.constraints.filter(function(constraint) {
				return constraint.get('references') === reference;
			});
			return ref_constraints;
		},

		//returns true if instance is reference or relative in a constraint
		inConstraint: function(instance){
			var ref = this.getConstraintsByReference(instance);
			var rel = this.getConstraintsByRelative(instance);
			if(ref.length>0|| rel.length>0){
				return true;
			}
			return false;
		},
		
		addConstraint: function(constraint, registerUndo) {
			this.insertConstraint(this.constraints.length, constraint, registerUndo);
		},

		addConstraintArray: function(constraints, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();
			}
			for (var i = 0; i < constraints.length; i++) {
				this.insertConstraint(this.constraints.length, constraints[i]);
			}
		},

		insertConstraint: function(index, constraint, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();
			}
			this.constraints.splice(index, 0, constraint);
			for (var i = 0; i < this.constraints.length; i++) {
				this.constraints[i].set('user_name', 'constraint ' + i);
			}
		},

		//removes all constraints on a given target on a given target
		removeConstraintsOn: function(target, registerUndo) {
			var constraints = [];
			if(target.get('name') == 'duplicator'){
				constraints.push.apply(constraints,this.removeConstraintsOn(target.masterList));
				for(var i=0;i<target.group_relative.length;i++){
					constraints.push.apply(constraints,this.removeConstraintsOn(target.group_relative[i]));
				}
			}
			constraints.push.apply(constraints,this.getConstraintsByRelative(target));
			constraints.push.apply(constraints, this.getConstraintsByReference(target));
			if (constraints.length > 0) {
				if (registerUndo) {
					this.addToUndoStack();
				}
				var self = this;
				constraints.forEach(function(constraint) {
					self.removeConstraint(constraint.get('id'));
				});
				return constraints;
			}

		},

		removeConstraint: function(id, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();
			}
			var constraint = this.getConstraintById(id);
			if (constraint) {
				var index = this.constraints.indexOf(constraint);
				this.constraints.splice(index, 1);
				constraint.deleteSelf();
				return constraint;
			}
		},

		

	});

	return ConstraintManager;
});