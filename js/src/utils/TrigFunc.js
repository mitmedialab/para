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

		//determines if point is on left or right of line
		TrigFunc.side = function(pA,pB,pM){
			
			var position = (pB.x - pA.x) * (pM.y -pA.y) - (pB.y - pA.y) * (pM.x - pA.x);   
			//console.log("position=");
			//console.log(position);
			if(position>0){
				return 1;
			}
			else if(position<0){
				return -1;

			}

			return 0;
		};

		return TrigFunc;
	});