/*PBool.js*
 * constrainable float class
 * for para instance properties
 * x: PProperty object for storing float value
 */

define([
		'underscore',
		'utils/PProperty',
		'utils/PBool'
	],

	function(_, PProperty, PBool) {

		var PString = PBool.extend({
			defaults: _.extend({}, PBool.prototype.defaults, {
				name: 'PString',
				dimension_num: 1
			}),
			/* constructor
			 * v: initial value of the float
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(v, operator) {
				this.v = new PProperty(v);
				PBool.apply(this, arguments);
				if (operator) {
					this.set('operator', operator);
				}
				this.setNull(false);
			},

			/* setValue
			 * sets the value of the property
			 */
			setValue: function(data) {
				console.log('setting value for pstring',data);
				if(data.hasOwnProperty('v')){
					this.v.setValue(data.v);
				}
				else{
					this.v.setValue(data);
				}
				console.log('new value',this.getValue());
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
				return d;

			},

			/*clone
			 * returns a static clone based on the current values of the point
			 * does not clone the constraints of the original
			 */
			clone: function() {
				return new PString(this.getValue());
			},

			add: function(){
				console.log("[ALERT], trying to add string value");
				//does nothing
			},


			toJSON: function() {
				var data = {v:this.getValue()};
				data.type = 'PString';
				return data;
			},


		});

		return PString;
	});