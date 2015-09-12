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
				name: 'PBool',
				dimension_num: 1
			}),
			/* constructor
			 * v: initial value of the float
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(v, operator) {
				
				if (v === true) {
					this.v = new PProperty(1);
				} else if ( v === false) {
					this.v = new PProperty(0);
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
			setValue: function(v) {
				if (v==true) {
					this.v.setValue(1);
				} else if(v==false) {
					this.v.setValue(0);
				}
				this.setNull(false);
			},

			/* getValue
			 * checks to see if val is constrained
			 * and if so, returns the constraint value
			 * otherwise just returns the current value of val.
			 */
			getValue: function() {
				var d;
				if (!this.isSelfConstrained()) {
					d = this.v.getValue();
				} else {
					d = this.getSelfConstraint().getValue();
				}
				if (d === 1) {
					return true;
				} else if (d === 0) {
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

			add: function(){
				console.log("[ALERT], trying to add boolean value");
				//does nothing
			},

			toJSON: function() {
				var data = {v:this.getValue()};
				data.type = 'PBool';
				return data;
			},


		});

		return PBool;
	});