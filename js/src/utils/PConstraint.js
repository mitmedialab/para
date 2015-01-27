	/*PConstraint.js
	 * base constraint class in para
	 *
	 */

	define([
		'underscore',
		'jquery',
		'backbone',
		'cjs'
	], function(_, $, Backbone, cjs) {

		var PConstraint = Backbone.Model.extend({

			defaults: {
				operator: 'add',
				isNull: true

			},

			initialize: function() {

			},

			setNull: function(val) {
				this.set('isNull', val);
			},

			isNull: function() {
				return this.get('isNull');
			},

			getConstraint: function() {
				if (this.constraint) {
					return this.constraint;
				} else {
					return this.val;
				}
			},

			removeConstraint: function() {
				if (this.isConstrained()) {
					this.val.setValue(this.getConstraint().getValue());
					this.constraint.set(null);
					delete this.constraint;
				}
			},

			isConstrained: function() {

				if (this.constraint) {
					return true;
				} else {
					return false;
				}
			},

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

			setRelativeConstraint: function(refProp, offset){
				//right now assumes that object can only have one constraint at a time
				refProp.removeConstraint();
				this.removeConstraint();

			},

			setEqualConstraint: function(refProp){
				//right now assumes that object can only have one constraint at a time
				refProp.removeConstraint();
				this.removeConstraint();

			}



		});
		return PConstraint;

	});