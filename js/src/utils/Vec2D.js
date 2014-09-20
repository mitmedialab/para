/* TrigFunc.js
 * a collection of useful geometric, trig and other math functions
 */

define([
		'toolbox',


	],

	function(Toolbox) {

		var Vec2D = Toolbox.Base.extend({

			constructor: function(x, y) {

				this.x = x;
				this.y = y;

			},

			add: function(val) {
				return new Vec2D(this.x + val.x, this.y + val.y);
			},

			sub: function(val) {
				return new Vec2D(this.x - val.x, this.y - val.y);
			},

			div: function(val) {
				return new Vec2D(this.x / val, this.y / val);
			},

			mul: function(val) {
				return new Vec2D(this.x * val, this.y * val);
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

		Vec2D.normalize = function(vec) {
			//Returns a new vector that has the same direction as vec, but has a length of one.
			if (vec.x === 0 && vec.y === 0) {
				return new Vec2D(0, 0);
			}

			return vec.div(vec.length());
		};



		return Vec2D;
	});