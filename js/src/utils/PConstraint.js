	/*PConstraint.js
	 * base class for all constrainable properties in para
	 *
	 */

	define([
		'underscore',
		'jquery',
		'backbone',
		'utils/PProperty'
	], function(_, $, Backbone, PProperty) {

		var PConstraint = Backbone.Model.extend({

			defaults: {
				operator: 'add',
				isNull: true,
				myArray: null,
				name: 'PConstraint',
				type: 'PConstraint',
				dimension_num: 1

			},

			constructor: function() {
				Backbone.Model.apply(this, arguments);
				for (var p in this) {
					if (this.hasOwnProperty(p) && (this[p] instanceof PConstraint || this[p] instanceof PProperty)) {
						this.listenTo(this[p], 'modified', this.modified);
					}
				}
				this.parentConstraint = false;
				this.pauseModNotice = false;
				this.constraintStack = [];
			},

			setPauseModifyNotice: function(status) {
				this.pauseModNotice = status;
			},

			pause: function() {
				if (this.isSelfConstrained()) {
					this.constraintObject.set('paused', true);
				} else {
					for (var p in this) {
						if (this.hasOwnProperty(p) && (this[p] instanceof PConstraint)) {
							this[p].pause();
						}
					}
				}
			},

			resume: function() {
				if (this.isSelfConstrained()) {
					if (this.constraintObject.get('paused')) {
						this.constraintObject.set('paused', false);
					}
					this.constraint.invalidate();
				} else {
					for (var p in this) {
						if (this.hasOwnProperty(p) && (this[p] instanceof PConstraint)) {
							this[p].resume();
						}
					}
				}
			},

			/* setNull
			 *  sets property default isNull to true
			 * used for prototpical inheritance functionality
			 */
			setNull: function(val) {
				this.set('isNull', val);
			},

			deleteSelf: function() {
				this.stopListening();
				this.removeAllConstraints();
				for (var p in this) {
					if (this.hasOwnProperty(p) && (this[p] instanceof PConstraint || this[p] instanceof PProperty)) {
						this[p].deleteSelf();
					}
				}
			},

			/* checks to see if property is null
			 * used for prototpical inheritance functionality
			 */
			isNull: function() {
				return this.get('isNull');
			},

			/*setConstraint
			 * sets constraint object if it exists
			 * or initializes a new one if it does not exist
			 * expects paramter to be a function
			 */
			setConstraint: function(func, constraint) {
				this.setNull(false);
				if (!this.isSelfConstrained()) {
					this.constraint = new PProperty(func);
					this.listenTo(this.constraint, 'modified', this.modified);
				} else {
					this.constraint.setValue(func);
				}
				this.constraintObject = constraint;
				this.constraintStack.push({
					obj: this.constraintObject,
					func: func,
					constraint: this.constraint,
				});

			},

			//callback triggered when a subproperty is modified externally 
			modified: function() {
				if (!this.pauseModNotice) {
					this.trigger('modified', this);
				}
			},



			/* removeConstraint
			 * removes the constraint of this property
			 */
			removeConstraint: function(dimensions) {
				if (!dimensions || dimensions.length === this.get('dimension_num')) {
					if (this.isSelfConstrained()) {
						var value = this.getValue();
						var deleted = this.constraintStack.pop();
						this.stopListening(this.constraint);
						this.constraint.deleteSelf();
						if (this.constraintStack.length > 0) {
							var lastConstraint = this.constraintStack.pop();
							this.setConstraint(lastConstraint.func, lastConstraint.obj);
						} else {
							this.constraint.deleteSelf();
							this.constraint = null;
							this.constraintObject = null;
							this.setValue(value);
						}
					}
				} else {
					for (var i = 0; i < dimensions.length; i++) {
						var dimension = dimensions[i];
						this[dimension].removeConstraint([dimensions[i]]);
					}

				}
			},

			removeAllConstraints: function(){
				while (this.constraintStack.length > 0) {	
						var lastConstraint = this.constraintStack.pop();
						lastConstraint.constraint.deleteSelf();
					}

			},

			/* isSelfConstrained
			 * checks for constraint applied to this object returns true if constraint exists
			 * false if not
			 */
			isSelfConstrained: function() {
				if (this.constraint) {
					return true;
				} else {
					return false;
				}
			},

			/*getSelfConstraint
			 * checks for constraint applied to this object returns the constraint of this object
			 * if it exists.
			 */
			getSelfConstraint: function() {
				if (this.constraint) {
					return this.constraint;
				}
			},


			isReference: function(instance) {
				if (this.isSelfConstrained()) {
					var reference = this.constraintObject.get('references');
					var hasMember = reference.hasMember(instance, true, reference);

					if (hasMember) {
						return true;
					}
					return false;
				} else {
					var subproperties = {};
					var isReference = false;
					for (var p in this) {
						if (this.hasOwnProperty(p) && (this[p] instanceof PConstraint)) {

							subproperties[p] = this[p].isReference(instance);
							if (subproperties[p]) {
								isReference = true;
							}

						}
					}
					if (isReference) {
						return subproperties;
					}
				}
				return false;
			},


			isValid: function() {
				var valid = true;
				for (var p in this) {
					if (this.hasOwnProperty(p) && (this[p] instanceof PConstraint || this[p] instanceof PProperty)) {
						valid = valid ? this[p].isValid() : false;
					}
				}
				return valid;
			},

			//invalidate all constrainable properties
			invalidate: function() {
				for (var p in this) {
					if (this.hasOwnProperty(p) && (this[p] instanceof PConstraint || this[p] instanceof PProperty)) {
						this[p].invalidate();
					}
				}
			}


		});
		return PConstraint;

	});