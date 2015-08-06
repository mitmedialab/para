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
			},

			/* setNull
			 *  sets property default isNull to true
			 * used for prototpical inheritance functionality
			 */
			setNull: function(val) {
				this.set('isNull', val);
			},

			deleteSelf: function() {
				//TODO: write cleanup delete code here.
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
			},

			setParentConstraint: function(dimensions, val) {
				for (var i = 0; i < dimensions.length; i++) {
					if (this.hasOwnProperty(dimensions[i]) && (this[dimensions[i]] instanceof PConstraint)) {
						this[dimensions[i]].parentConstraint = val;
					}
				}
			},

			//callback triggered when a subproperty is modified externally 
			modified: function() {
				this.trigger('modified', this);
			},



			/* removeConstraint
			 * removes the constraint of this property
			 */
			removeConstraint: function(dimensions) {
				if (!dimensions || dimensions.length === this.get('dimension_num')) {
					if (this.isSelfConstrained()) {
						var value = this.getValue();
						this.constraint = null;
						this.constraintObject = null;
						this.setValue(value);
					}
				} else {

					for (var i = 0; i < dimensions.length; i++) {
						var dimension = dimensions[i];
						this[dimension].removeConstraint([dimensions[i]]);
					}

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