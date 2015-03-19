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
				myArray: null

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
				if (!this.isSelfConstrained()) {
					this.constraint = new PProperty(func);
				}
				else{
					this.constraint.setValue(func);
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

		});
		return PConstraint;

	});