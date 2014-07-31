/* TrigFunc.js
 * a collection of useful geometric, trig and other math functions
 */

define([
		'toolbox',
		'utils/Vec2D'

	],

	function(Toolbox, Vec2D) {


		var TrigFunc = Toolbox.Base.extend({


		});

		TrigFunc.equals = function(p1, p2) {
			if (p1.x === p2.x && p1.y === p2.y) {
				return true;
			}
			return false;
		};

		TrigFunc.cartToPolar = function(p1, p2) {

			var r = 0;
			var theta = 0;
			var x = p2.x - p1.x;
			var y = p2.y - p1.y;
			r = Math.sqrt((x * x) + (y * y));

			var type = 0;
			if (x > 0 && y >= 0) {
				type = 1;
			}
			if (x > 0 && y < 0) {
				type = 2;
			}
			if (x < 0) {
				type = 3;
			}
			if (x === 0 && y > 0) {
				type = 4;
			}
			if (x === 0 && y < 0) {
				type = 5;
			}
			if (x === 0 && y === 0) {
				type = 6;
			}

			//Find theta
			switch (type) {
				case (1):
					theta = Math.atan(y / x) * (180.0 / Math.PI);
					break;
				case (2):
					theta = (Math.atan(y / x) + 2 * Math.PI) * (180.0 / Math.PI);
					break;
				case (3):
					theta = (Math.atan(y / x) + Math.PI) * (180.0 / Math.PI);
					break;
				case (4):
					theta = (Math.PI / 2.0) * (180.0 / Math.PI);
					break;
				case (5):
					theta = ((3 * Math.PI) / 2.0) * (180.0 / Math.PI);
					break;
				case (6):
					theta = 0.0;
					break;
				default:
					theta = 0.0;
					break;
			}

			return {
				rad: r,
				theta: theta
			};

		};

		TrigFunc.polarToCart = function(r, theta) {
			var x = Math.cos(theta * (Math.PI / 180.0)) * r;
			var y = Math.sin(theta * (Math.PI / 180.0)) * r;


			return {
				x: x,
				y: y
			};
		};

		TrigFunc.subtract = function(p1, p2) {
			return {
				x: p1.x - p2.x,
				y: p1.y - p2.y
			};
		};


		TrigFunc.add = function(p1, p2) {
			return {
				x: p1.x + p2.x,
				y: p1.y + p2.y
			};
		};

		TrigFunc.average = function(points) {
			if (points.length === 0) {
				return null;
			} else if (points.length === 1) {
				return points[0];
			} else {
				var average = points[0];
				for (var i = 1; i < points.length; i++) {
					average = average.add(points[i]);
				}
				var x = average.x / points.length;
				var y = average.y / points.length;
				return {
					x: x,
					y: y
				};
			}
		};

		TrigFunc.distance = function(p1, p2) {
			//console.log("p1="+p1);
			//console.log("p2="+p2);
			var distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
			return distance;
		};

		TrigFunc.midpoint = function(p1, p2) {
			var x = (p1.x + p2.x) / 2;
			var y = (p1.y + p2.y) / 2;

			return {
				x: x,
				y: y
			};
		};

		//determines if point is on left or right of line
		TrigFunc.side = function(pA, pB, pM) {

			var position = (pB.x - pA.x) * (pM.y - pA.y) - (pB.y - pA.y) * (pM.x - pA.x);
			//console.log("position=");
			//console.log(position);
			if (position > 0) {
				return 1;
			} else if (position < 0) {
				return -1;

			}

			return 0;
		};

		return TrigFunc;
	});