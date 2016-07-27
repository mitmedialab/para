/*PFloat.js*
 * constrainable float class
 * for para instance properties
 * x: PProperty object for storing float vue
 */

define([
		'underscore',
		'models/data/properties/PProperty',
		'models/data/properties/PConstraint'
	],

	function(_, PProperty, PConstraint) {



		var PFloat = PConstraint.extend({
			defaults: _.extend({}, PConstraint.prototype.defaults, {
				name: 'PFloat',
				dimension_num: 1
			}),
			/* constructor
			 * v: initial value of the float
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(v, operator) {
				this.v = new PProperty(v);
				PConstraint.apply(this, arguments);
				if (operator) {
					this.set('operator', operator);
				}
				this.setNull(false);
				//this.on('constraint_set',this.messageConstraint);
			},

			removeConstraint: function() {
				if (this.isSelfConstrained()) {
					var value = this.getValue();
					var deleted = this.constraintStack.pop();
					this.stopListening(this.constraint);

					if (this.constraintStack.length > 0) {
						var lastConstraint = this.constraintStack.pop();
						this.setConstraint(lastConstraint.func, lastConstraint.obj);
					} else {

						this.constraint = null;
						this.constraintObject = null;
						this.setValue(value);
					}
				}

			},

			/* isConstrained
			 * returns object with booleans for each property based on constraint status
			 */
			isConstrained: function() {
				var data = {};
				data = this.isSelfConstrained();
				return data;
			},

			/* getConstraint
			 * returns object if constraint exists
			 * null otherwise
			 */
			getConstraint: function() {
				var data;

				if (this.isSelfConstrained()) {
					data = this.getSelfConstraint();
					return data;
				}
			},
			/* setValue
			 * sets the value of the property
			 */
			setValue: function(data) {
			  var set;
                          if (typeof data == 'function')
                          {
                            set = this.v.setValue(data);
			    this.setNull(false);
                            return set;
                          }
                          else
                          {
                            if (this.hasConstraint())
                            {
                              return false;
                            }
                            else if (data.v)
                            {
			      set = this.v.setValue(data.v);
			      this.setNull(false);
			    }
                            else if (typeof data === "number")
                            {
			      set = this.v.setValue(data);
			      this.setNull(false);
			    }
                            else
                            {
                              return false;
                            }

			    return set;
                          }
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
					return this.getSelfConstraint().getValue();
				}
			},

			/*clone
			 * returns a static clone based on the current values of the point
			 * does not clone the constraints of the original
			 */
			clone: function() {
				return new PFloat(this.getValue());
			},

			onValueChanged: function(handler) {
				this.v.onValueChanged(handler);
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
				data.type = 'PFloat';
				return data;
			},



		});

		return PFloat;
	});
