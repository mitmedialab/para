/* ColorUtils.js
 * a collection of operations for color conversion
 */

define([
		'toolbox',
		'paper'

	],

	function(Toolbox, paper) {
		var ColorUtils = Toolbox.Base.extend({


		});

		ColorUtils.rgbToHsl = function(color) {
			var r = color.r;
			var g = color.g;
			var b = color.b;

			var pcolor = new paper.Color(r,g,b);
			return [pcolor.hue,pcolor.saturation,pcolor.lightness];
		};

		ColorUtils.hslToRgb = function(h, s, l) {
			
			var color = new paper.Color();
			color.hue = h;
			color.saturation = s;
			color.brightness = l;
			return [color.red,color.green,color.blue];
		};

		
		ColorUtils.toHex = function(color){
			if(color.r){
				return this.rgbToHex(color);
			}
			else{
				var rgb = this.hslToRgb(color.h,color.s,color.l);
				return this.rgbToHex({r:rgb[0],g:rgb[1],b:rgb[2]});
			}
		};


		ColorUtils.rgbToHex = function(color) {
			return "#" + this.componentToHex(color.r*255) + this.componentToHex(color.g*255) + this.componentToHex(color.b*255);
		};

		ColorUtils.componentToHex = function(c) {
			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		};

		ColorUtils.hexToR = function(h) {
			if (h == -1) {
				return null;
			}
			return parseInt((this.cutHex(h)).substring(0, 2), 16) / 255;
		};
		ColorUtils.hexToG = function(h) {
			if (h == -1) {
				return null;
			}
			return parseInt((this.cutHex(h)).substring(2, 4), 16) / 255;
		};
		ColorUtils.hexToB = function(h) {
			if (h == -1) {
				return null;
			}
			return parseInt((this.cutHex(h)).substring(4, 6), 16) / 255;
		};

		ColorUtils.cutHex = function(h) {
			return (h.charAt(0) == '#') ? h.substring(1, 7) : h;
		};


		return ColorUtils;
	});