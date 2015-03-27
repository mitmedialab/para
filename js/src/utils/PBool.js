/*PBool.js*
 * constrainable float class
 * for para instance properties
 * x: PProperty object for storing float value
 */

define([
		'underscore',
		'utils/PProperty',
		'utils/PFloat'
	],

	function(_, PProperty, PFloat) {

		var PBool = PFloat.extend({
			defaults: _.extend({}, PFloat.prototype.defaults, {
				name: 'PBool'
			}),
			/* constructor
			 * val: initial value of the float
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(val, operator) {
				if (val === true) {
					this.val = new PProperty(1);
				} else if (val === false) {
					this.val = new PProperty(0);
				}
				PFloat.apply(this, arguments);
				if (operator) {
					this.set('operator', operator);
				}
				this.setNull(false);
			},

			/* setValue
			 * sets the value of the property
			 */
			setValue: function(val) {
				if (val === true) {
					this.val.setValue(1);
				} else if (val === false) {
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