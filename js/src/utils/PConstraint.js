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
				isNull: true

			},

			initialize: function() {

			},

			/* setNull
			*  sets property default isNull to true
			* used for prototpical inheritance functionality
			*/
			setNull: function(val) {
				this.set('isNull', val);
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
			setConstraint: function(func){
				if (!this.isConstrained()) {
					
					this.constraint = new PProperty(func);
				}
				else{
					this.constraint.setValue(func);
				}
			},

			/*getConstraint
			* returns the constraint of this property
			* if it exists.
			*/
			getConstraint: function() {
				if (this.constraint) {
					return this.constraint;

				} 
			},

			/* removeConstraint
			* removes the constraint of this property
			*/
			removeConstraint: function(axis) {
				if (this.isConstrained()) {
						this.constraint.setValue(null);
						delete this.constraint;
					}
				
			},

			/* isConstrained
			* returns true if constraint exists
			* false if not
			*/
			isConstrained: function() {

				if (this.constraint) {
					return true;
				} else {
					return false;
				}
			},

			/* modify
			* update the value of the property
			* based on a data argument. This is called
			* when shapes are transformed by the user to
			* update their properties
			*/
			modify: function(data) {
				for (var p in data) {
					if (data.hasOwnProperty(p)) {
						var data_property = data[p];
						if (this.hasOwnProperty(p)) {
							this.setNull(false);
							if (data.operator === 'set') {
								this[p].setValue(data_property);
							} else {
								this[p].setValue(this[p].getValue() + data_property);
							}
						}
					}
				}
			},

		});
		return PConstraint;

	});