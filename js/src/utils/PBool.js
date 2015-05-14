/*PBool.js*
 * constrainable float class
 * for para instance properties
 * x: PProperty object for storing float value
 */

define([
		'underscore',
		'utils/PProperty',
		'utils/PConstraint'
	],

	function(_, PProperty, PConstraint) {

		var PBool = PConstraint.extend({
			defaults: _.extend({}, PConstraint.prototype.defaults, {
				name: 'PBool'
			}),
			/* constructor
			 * val: initial value of the float
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(val, operator) {
				if (val) {
					this.val = new PProperty(1);
				} else if (!val) {
					this.val = new PProperty(0);
				}
				if (operator) {
					this.set('operator', operator);
				}
				PConstraint.apply(this, arguments);
				this.setNull(false);
			},

			/* setValue
			 * sets the value of the property
			 */
			setValue: function(val) {
				if (val) {
					this.val.setValue(1);
				} else if (!val) {
					this.val.setValue(0);
				}
			},

			/* getValue
			 * checks to see if val is constrained
			 * and if so, returns the constraint value
			 * otherwise just returns the current value of val.
			 */
			getValue: function() {
				var v;
				if (!this.isSelfConstrained()) {

					v = this.val.getValue();
					console.log('bool val=',v);
					console.trace();
				} else {
					v = this.getSelfConstraint().getValue();
				}
				if (v === 1) {
					return true;
				} else if (v === 0) {
					return false;
				}


			},

			/*clone
			 * returns a static clone based on the current values of the point
			 * does not clone the constraints of the original
			 */
			clone: function() {
				return new PBool(this.getValue());
			},

		});

		return PBool;
	});