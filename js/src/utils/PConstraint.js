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
						this.listenTo(this[p], 'modified', this.propertyModified);
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

			deleteSelf: function(){
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
			setConstraint: function(func, r) {
				if (!this.isSelfConstrained()) {
					this.constraint = new PProperty(func);
				} else {
					this.constraint.setValue(func);
				}
				if (r) {
					console.log('setting reference to', r);
					this.reference = r;
				}
				//this.trigger('constraint_set');
			},



			/* removeConstraint
			 * removes the constraint of this property
			 */
			removeConstraint: function(axis) {
				if (this.isSelfConstrained()) {
					this.constraint.setValue(null);
					delete this.constraint;
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

			/* modify
			 * update the value of the property
			 * based on a data argument. This is called
			 * when shapes are transformed by the user to
			 * update their properties
			 */
			modifyProperty: function(data) {
				for (var p in data) {
					if (data.hasOwnProperty(p)) {
						var data_property = data[p];
						if (this.hasOwnProperty(p) && !this.isNull()) {

							if (data.operator === 'set') {
								//console.log('modifying via set');
								this[p].setValue(data_property);
							} else {
								//console.log('modifying via add');
								this[p].setValue(this[p].getValue() + data_property);
							}
						}
					}
				}
			},
			//callback triggered when a subproperty is modified externally 
			propertyModified: function(event) {
				this.trigger('modified', this);
			},

			//invalidate all constrainable properties
			invalidate: function(){
				for (var p in this) {
					if (this.hasOwnProperty(p) && (this[p] instanceof PConstraint || this[p] instanceof PProperty)) {
						this[p].invalidate();
					}
				}
			}


		});
		return PConstraint;

	});
