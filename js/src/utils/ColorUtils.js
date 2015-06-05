/* ColorUtils.js
 * a collection of operations for color conversion
 */

define([
		'toolbox',

	],

	function(Toolbox) {
		var ColorUtils = Toolbox.Base.extend({


		});

		ColorUtils.rgbToHsl = function(color) {
			var r = color.r;
			var g = color.g;
			var b = color.b;

			r /= 255;
			g /= 255;
			b /= 255;
			var max = Math.max(r, g, b),
				min = Math.min(r, g, b);
			var h, s, l = (max + min) / 2;

			if (max == min) {
				h = s = 0; // achromatic
			} else {
				var d = max - min;
				s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
				switch (max) {
					case r:
						h = (g - b) / d + (g < b ? 6 : 0);
						break;
					case g:
						h = (b - r) / d + 2;
						break;
					case b:
						h = (r - g) / d + 4;
						break;
				}
				h /= 6;
			}

			return [h, s, l];
		};

		ColorUtils.hsltoRgb = function(h, s, l) {
			var r, g, b;
			if (s === 0) {
				r = g = b = l; // achromatic
			} else {

				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				r = this.hue2rgb(p, q, h + 1 / 3);
				g = this.hue2rgb(p, q, h);
				b = this.hue2rgb(p, q, h - 1 / 3);
			}

			return [r * 255, g * 255, b * 255];
		};

		ColorUtils.hue2rgb = function(p, q, t) {
			if (t < 0) {
				t += 1;
			}
			if (t > 1) {
				t -= 1;
			}
			if (t < 1 / 6) {
				return p + (q - p) * 6 * t;
			}
			if (t < 1 / 2) {
				return q;
			}
			if (t < 2 / 3) {
				return p + (q - p) * (2 / 3 - t) * 6;
			}
			return p;
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