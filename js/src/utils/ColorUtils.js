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
			
			var color = new paper.Color({hue:h,saturation:s,lightness:l});
			return [color.red,color.green,color.blue];
		};

		
		ColorUtils.toHex = function(color){
			console.log('toHex',color);
			if(color.h!==undefined){
				var rgb = this.hslToRgb(color.h,color.s,color.l);
				var hex =  this.rgbToHex({r:rgb[0],g:rgb[1],b:rgb[2]});
				console.log('rgb,hex,color',rgb,hex,color);
				return hex;
			}
			else{
				return this.rgbToHex(color);
			}

		};


		ColorUtils.rgbToHex = function(color) {
			return "#" + this.componentToHex(Math.round(color.r*255)) + this.componentToHex(Math.round(color.g*255)) + this.componentToHex(Math.round(color.b*255));
		};

		ColorUtils.componentToHex = function(c) {
			var hex = c.toString(16);
			return hex.length == 1 ? "0" + hex : hex;
		};

		ColorUtils.hexToR = function(h) {
			
			return parseInt((this.cutHex(h)).substring(0, 2), 16) / 255;
		};
		ColorUtils.hexToG = function(h) {
			
			return parseInt((this.cutHex(h)).substring(2, 4), 16) / 255;
		};
		ColorUtils.hexToB = function(h) {
			return parseInt((this.cutHex(h)).substring(4, 6), 16) / 255;
		};

		ColorUtils.cutHex = function(h) {
			return (h.charAt(0) == '#') ? h.substring(1, 7) : h;
		};

		ColorUtils.hexToRGB = function(hex){
			var rgb = {r:this.hexToR(hex),g:this.hexToG(hex),b:this.hexToB(hex)};
			var hsl = this.rgbToHsl(rgb);
			var data = {r:rgb.r,g:rgb.g,b:rgb.b,h:hsl[0],s:hsl[1],l:hsl[2],operator:'set'};
			return data;
		};


		return ColorUtils;
	});