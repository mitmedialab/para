/* TrigFunc.js
 * a collection of useful geometric, trig and other math functions
 */

define([
		'toolbox'

	],

	function(Toolbox) {

		var TrigFunc = Toolbox.Base.extend({
			

		});

		TrigFunc.equals = function(p1,p2){
			if(p1.x===p2.x && p1.y===p2.y){
				return true;
			}
			return false;
		};

		TrigFunc.distance= function(p1, p2) {
			//console.log("p1="+p1);
			//console.log("p2="+p2);
				var distance = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
				return distance;
			};

		TrigFunc.midpoint= function(p1, p2) {
				var x = (p1.x + p2.x) / 2;
				var y = (p1.y + p2.y) / 2;

				return {
					x: x,
					y: y
				};
			};

		return TrigFunc;
	});