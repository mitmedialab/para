/*PPoint.js*
 * point class for para
 */

define([

		'paper',
		'cjs',
		'utils/PProperty',
		'utils/PConstraint'


	],

	function(paper, cjs, PProperty, PConstraint) {

		var PFloat = PConstraint.extend({

			constructor: function(val, operator) {

				this.val = new PProperty(val);
				PConstraint.apply(this, arguments);
				if (operator) {
					this.set('operator', operator);
				}
				this.setNull(false);
			},

			setValue: function(val) {
				this.val.setValue(val);
			},

			getValue: function() {
				return this.getConstraint().getValue();
			},

			add: function(val, newP) {
				if (newP) {
					var float2 = this.clone();
					float2.add(val);
					return float2;
				} else {
					this.setValue(this.getValue() + val);
				}
			},

			sub: function(val, newP) {
				if (newP) {
					var float2 = this.clone();
					float2.sub(val);
					return float2;
				} else {
					this.setValue(this.getValue() - val);
				}
			},
			div: function(val, newP) {
				if (newP) {
					var float2 = this.clone();
					float2.div(val);
					return float2;
				} else {
					this.setValue(this.getValue() / val);
				}
			},

			mul: function(val, newP) {
				if (newP) {
					var float2 = this.clone();
					float2.mul(val);
					return float2;
				} else {
					this.setValue(this.getValue() * val);
				}
			},

			/*clone
			 * returns a static clone based on the current values of the point
			 * does not clone the constraints of the original
			 */
			clone: function() {
				return new PFloat(this.getValue());
			},

			setRelativeConstraint: function(refProp, offset) {
				PConstraint.prototype.setRelativeConstraint.call(this, refProp, offset);
				var f = function() {
					return refProp.getValue() + offset;
				};
				if (this.constraint) {
					this.constraint.setValue(f);
				} else {
					this.constraint = new PProperty(f);
				}
			},

			/* removes prior equality constraints
			 * will need a constraints manager to effectively set
			 * and maintain equality constraints accross multiple objects
			 */
			setEqualConstraint: function(refProp) {
				PConstraint.prototype.setEqualConstraint.call(this, refProp);
				var f = function() {
					return refProp.val.getValue();
				};

				this.constraint = new PProperty(f);
				this.val = refProp.val;
				refProp.constraint = new PProperty(f);
			},

			setConditionalConstraint: function(refProp, operator) {
				var relVal = this.getConstraint();
				var refVal = refProp.getConstraint();
				var statement = "relVal.getValue() "+operator+" refVal.getValue()";
		
				var f = function() {
					if (eval(statement)) {
						return relVal.getValue();
					} else {
						relVal.setValue(refVal.getValue());
						return refVal.getValue();
					}
				};

				this.constraint = new PProperty(f);
			}



		});



		return PFloat;
	});