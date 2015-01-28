/* ColorUtils.js
 * a collection of operations for color conversion
 */

define([
		'toolbox',

	],

	function(Toolbox) {
		var ColorUtils = Toolbox.Base.extend({


		});

		ColorUtils.hexToR = function(h) {
			if(h==-1){
				return null;
			}
			return parseInt((this.cutHex(h)).substring(0, 2), 16)/255;
		};
		ColorUtils.hexToG = function(h) {
				if(h==-1){
				return null;
			}
			return parseInt((this.cutHex(h)).substring(2, 4), 16)/255;
		};
		ColorUtils.hexToB = function(h) {
				if(h==-1){
				return null;
			}
			return parseInt((this.cutHex(h)).substring(4, 6), 16)/255;
		};

		ColorUtils.cutHex = function(h) {

			return (h.charAt(0) == '#') ? h.substring(1, 7) : h;
		};


		return ColorUtils;
	});