
/*PVal.js*
 * constrainable float class
 * for para instance properties
 * x: PProperty object for storing 1 dimensional constrainable value
 */

define([
		'underscore',
		'paper',
		'models/data/properties/PFloat',
		'models/data/properties/PConstraint'
	],

	function(_, paper, PFloat, PConstraint) {



		var PVal = PConstraint.extend({
			defaults: _.extend({}, PConstraint.prototype.defaults, {
				name: 'PVal',
				dimension_num: 1
			}),
			/* constructor
			 * v: initial value of the float
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(v, operator) {
				this.v = new PFloat(v);
				PConstraint.apply(this, arguments);
				if (operator) {
					this.set('operator', operator);
				}
				this.setNull(false);
				//this.on('constraint_set',this.messageConstraint);
			},


			/* isConstrained
			 * returns object with booleans for each property based on constraint status
			 */
			isConstrained: function() {
				var data = {};
				data.self = this.isSelfConstrained();
				data.v = this.v.isConstrained();
				return data;
			},

			/* getConstraint
			 * returns object if constraint exists
			 * null otherwise
			 */
			getConstraint: function() {
				var data = {};
				var self = this.getSelfConstraint();
				if (self) {
					return self;
				} else {
					var v = this.v.getConstraint();
					if (v) {
						data.v = v;
					}
					return data;
				}

			},

			/* setValue
			 * sets the value of the property
			 */
			setValue: function(data) {
				var set;
				if (data.v) {
					set = this.v.setValue(data.v);
					this.setNull(false);
				} else if (typeof data === "number") {
					set =this.v.setValue(data);
					this.setNull(false);
				}
				return set;
			},

			/*
			messageConstraint: function(v){
				this.trigger('constraint_set')
			},*/

			/* getValue
			 * checks to see if v is constrained
			 * and if so, returns the constraint value
			 * otherwise just returns the current value of val.
			 */
			getValue: function() {
				if (!this.isSelfConstrained()) {
					return this.v.getValue();
				} else {
					var value = this.getSelfConstraint().getValue();
					return value;
				}
			},

			/*clone
			 * returns a static clone based on the current values of the point
			 * does not clone the constraints of the original
			 */
			clone: function() {
				return new PVal(this.v.getValue());
			},

			/* basic math operations */
			add: function(data, newP) {
				if (newP) {
					var float2 = this.clone();
					float2.add(data);
					return float2;
				} else {
					if (data.v) {
						this.setValue(this.v.getValue() + data.v);
					} else if (typeof data === "number") {
						this.setValue(this.v.getValue() + data);
					}
				}
			},

			sub: function(v, newP) {
				if (newP) {
					var float2 = this.clone();
					float2.sub(v);
					return float2;
				} else {
					this.setValue(this.v.getValue() - v);
				}
			},

			div: function(v, newP) {
				if (newP) {
					var float2 = this.clone();
					float2.div(v);
					return float2;
				} else {
					this.setValue(this.v.getValue() / v);
				}
			},

			mul: function(v, newP) {
				if (newP) {
					var float2 = this.clone();
					float2.mul(v);
					return float2;
				} else {
					this.setValue(this.v.getValue() * v);
				}
			},

			toJSON: function() {
				var data = this.getValue();
				data.type = 'PVal';
				return data;
			},



		});

		return PVal;
	});