/*PPoint.js*
* point class for para
*/

define([
		'toolbox',
		'paper',


	],

	function(Toolbox, paper) {

		var PPoint = Toolbox.Base.extend({

			constructor: function(x, y) {

				this.x = x;
				this.y = y;

			},

			set: function(point) {
				this.x = point.x;
				this.y = point.y;
			},

			setX: function(x){
				this.x=x;
			},

			setY: function(y){
				this.y=y;
			},

			add: function(point) {
				this.x += point.x;
				this.y += point.y;
			},

			sub: function(point) {
				this.x -= point.x;
				this.y -= point.y;
			},

			div: function(val) {
				this.x /= val;
				this.y /= val;
			},

			mul: function(val) {
				this.x *= val;
				this.y *= val;
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

			clone: function(){
				return new PPoint(this.x,this.y);
			},

			toPaperPoint: function(){
				

				return new paper.Point(this.x, this.y);
			}

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