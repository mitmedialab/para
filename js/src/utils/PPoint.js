/*PPoint.js*
 * constrainable point class
 * for para instance properties
 * x: PFloat object for storing x coordinate
 * y: PFloat object storing y coordinate
 */

define([

		'paper',
		'cjs',
		'utils/PFloat',
		'utils/PConstraint'
	],

	function(paper, cjs, PFloat, PConstraint) {

		var PPoint = PConstraint.extend({
			/* constructor
			 * x, y: initial x and y coordinates
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(x, y, operator) {
				this.x = new PFloat(x);
				this.y = new PFloat(y);
				PConstraint.apply(this, arguments);
				if (operator) {
					this.set('operator', operator);
				}
				this.setNull(false);
			},

			/* setValue
			 * accepts an object with x,y properties as an argument
			 */
			setValue: function(point) {
				this.setX(point.x);
				this.setY(point.y);
			},

			/* getValue
			 * returns an object with current x and y values as properties
			 */
			getValue: function() {
				if (!this.isConstrained()) {
					return {
						x: this.getX(),
						y: this.getY(),
					};
				} else {
					return this.getConstraint().getValue();
				}
			},

			/*get and set funcitons for x and y*/
			getX: function() {
				if (this.isConstrained()) {
					return this.getConstraint().getValue().x;
				} else {
					return this.x.getValue();
				}

			},

			getY: function() {
				if (this.isConstrained()) {
					return this.getConstraint().getValue().y;
				} else {
					return this.y.getValue();
				}
			},

			setX: function(x) {
				this.x.setValue(x);
				this.setNull(false);
			},

			setY: function(y) {
				this.y.setValue(y);
				this.setNull(false);
			},

			/*clone
			 * returns a static clone based on the current values of the point
			 * does not clone the constraints of the original
			 */
			clone: function() {
				return new PPoint(this.getX(), this.getY());
			},

			/*toPaperPoint
			 * returns a paper.js point object based on the current
			 * values of this object
			 */
			toPaperPoint: function() {
				return new paper.Point(this.getX(), this.getY());
			},

			/* basic math operations */
			add: function(data, newP) {
				if (newP) {
					var point2 = this.clone();
					point2.add(data);
					return point2;
				} else {
					this.setX(this.getX() + data.x);
					this.setY(this.getY() + data.y);
				}
			},

			sub: function(data, newP) {
				if (newP) {
					var point2 = this.clone();
					point2.sub(data);
					return point2;
				} else {
					this.setX(this.getX() - data.x);
					this.setY(this.getY() - data.y);

				}
			},

			div: function(val, newP) {
				if (newP) {
					var point2 = this.clone();
					point2.div(val);
					return point2;
				} else {
					this.setX(this.getX() / val);
					this.setY(this.getY() / val);
				}
			},

			mul: function(val, newP) {
				if (newP) {
					var point2 = this.clone();
					point2.mul(val);
					return point2;
				} else {
					this.setX(this.x.get() * val);
					this.setY(this.y.get() * val);
				}
			},

			distanceSqrd: function(vec1, vec2) {
				return (Math.pow(vec1.x - vec2.x, 2) + Math.pow(vec1.y - vec2.y, 2));
			},

			distance: function(vec1, vec2) {
				//Returns the distance between two points
				return Math.sqrt(this.distanceSqrd(vec1, vec2));
			},

			lengthSqrd: function(vec) {
				//Returns the length of a vector sqaured. Faster than Length(), but only marginally
				return Math.pow(vec.x, 2) + Math.pow(vec.y, 2);
			},


			length: function() {
				//Returns the length of a vector'
				return Math.sqrt(this.lengthSqrd(this));
			},


			dot: function(b) {
				//Computes the dot product of a and b'
				return (this.x * b.x) + (this.y * b.y);
			},


			projectOnto: function(v, w) {
				//'Projects w onto v.'
				return v.mul(w.dot(v) / this.lengthSqrd(v));
			},



		});

		PPoint.normalize = function(vec) {
			//Returns a new vector that has the same direction as vec, but has a length of one.
			if (vec.x === 0 && vec.y === 0) {
				return new PPoint(0, 0);
			}

			return vec.div(vec.length());
		};



		return PPoint;
	});