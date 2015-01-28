/*PColor.js*
 * constrainable color class
 * for para instance properties
 * r: PFloat object for storing red value
 * g: PFloat object for storing green value
 * b: PFloat object for storing blue value
 * a: PFloat object for storing alpha value
 */

define([

		'paper',
		'cjs',
		'utils/PFloat',
		'utils/PConstraint',
		'utils/ColorUtils'
	],

	function(paper, cjs, PFloat, PConstraint, ColorUtils) {

		var PColor = PConstraint.extend({
			/* constructor
			 * r,g,b,a: initial color values
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(r, g, b, a, operator) {

				this.r = new PFloat(r);
				this.g = new PFloat(g);
				this.b = new PFloat(b);
				this.a = new PFloat(a);
				PConstraint.apply(this, arguments);

				if (operator) {
					this.set('operator', operator);
				} else {
					this.set('operator', 'set');
				}
				this.setNull(false);
			},

			/* setValue
			 * sets rgb values
			 */
			setValue: function(r, g, b, a) {

				this.setR(r);
				this.setG(g);
				this.setB(b);
				if (a) {
					this.setA(a);
				}

			},
			/* getValue
			 * returns an object with current rgba values as properties
			 */
			getValue: function() {
				return {
					r: this.getR(),
					g: this.getG(),
					b: this.getB(),
					a: this.getA()
				};
			},

			/*get and set funcitons for rgba*/
			getR: function() {
				return this.r.getValue();
			},

			getG: function() {
				return this.g.getValue();
			},

			getB: function() {
				return this.b.getValue();
			},

			getA: function() {
				return this.a.getValue();
			},

			setR: function(r) {
				this.r.setValue(r);
				this.setNull(false);
			},

			setG: function(g) {
				this.g.setValue(g);
				this.setNull(false);
			},

			setB: function(b) {
				this.b.setValue(b);
				this.setNull(false);
			},

			setA: function(a) {
				this.a.setValue(a);
				this.setNull(false);
			},


			/*clone
			 * returns a static clone based on the current values of the point
			 * does not clone the constraints of the original
			 */
			clone: function() {
				return new PColor(this.getR(), this.getG(), this.getB(), this.getA());
			},
			/*toPaperColor
			 * returns a paper.js color object based on the current
			 * values of this object
			 */
			toPaperColor: function() {
				return new paper.Color(this.getR(), this.getG(), this.getB(), this.getA());
			}

		});


		return PColor;
	});