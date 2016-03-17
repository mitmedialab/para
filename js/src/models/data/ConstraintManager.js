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

		//undo to last state
		undo: function(manager) {

			if (this.previousStates.length > 0) {
				console.log('calling undo on', this.get('name'),this.futureStates);

				var state = this.previousStates.pop();
				var currentState = this.toJSON();
				this.futureStates.push(currentState);
				this.parseJSON(state, manager);


			}
		},

		redo: function(manager) {
			if (this.futureStates.length > 0) {
				console.log('calling redo on', this.get('name'),this.futureStates);
				var state = this.futureStates.pop();
				var currentState = this.toJSON();
				this.previousStates.push(currentState);
				this.parseJSON(state, manager);
			}

		},

		addToUndoStack: function() {
			if (!this.stateStored) {
				this.previousStates.push(this.toJSON());
				this.stateStored = true;
				this.futureStates = [];
				//console.log(this.get('name'), ' stored state', this.previousStates);
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

		toJSON: function() {
			var constraint_json = [];
			for (var i = 0; i < this.constraints.length; i++) {
				var data = this.constraints[i].toJSON();
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

		removeConstraint: function(id, registerUndo) {
			if (registerUndo) {
				this.addToUndoStack();
			}
			var constraint = this.getConstraintById(id);
			if (constraint) {
				var index = this.constraints.indexOf(constraint);
				this.constraints.splice(index, 1);
				constraint.deleteSelf();
			}
		},

		deleteAllConstraints: function() {
			for (var i = 0; i < this.constraints.length; i++) {
				this.constraints[i].deleteSelf();
			}
			this.constraints.length = 0;
		}

	});

	return ConstraintManager;
});