/*PColor.js*
 * constrainable color class
 * for para instance properties
 * r: PFloat object for storing red value
 * g: PFloat object for storing green value
 * b: PFloat object for storing blue value
 * a: PFloat object for storing alpha value
 */

define([
		'underscore',
		'paper',
		'cjs',
		'models/data/properties/PFloat',
		'models/data/properties/PConstraint',
		'models/data/properties/PBool',
		'utils/ColorUtils'
	],

	function(_, paper, cjs, PFloat, PConstraint, PBool, ColorUtils) {

		var PColor = PConstraint.extend({

			defaults: _.extend({}, PConstraint.prototype.defaults, {
				name: 'PColor',
				dimension_num: 4
			}),
			/* constructor
			 * r,g,b,a: initial color values
			 * operator: optional argument to specify the
			 * operation performed when property is modified
			 */
			constructor: function(r, g, b, a, operator) {

				this.r = new PFloat(r);
				this.g = new PFloat(g);
				this.b = new PFloat(b);
				this.a = new PFloat(a);
				var hsl = ColorUtils.rgbToHsl({
					r: r,
					g: g,
					b: b
				});
				this.h = new PFloat(hsl[0]);
				this.s = new PFloat(hsl[1]);
				this.l = new PFloat(hsl[2]);
				this.noColor = new PBool(false);
				this.setMode = 'hsb';
				PConstraint.apply(this, arguments);

				if (operator) {
					this.set('operator', operator);
				} else {
					this.set('operator', 'set');
				}
				this.a.setValue(1);
				this.setNull(false);
			},

			

			/* isConstrained
			 * returns object with booleans for each property based on constraint status
			 */
			isConstrained: function() {
				var data = {};
				data.self = this.isSelfConstrained();
				data.r = this.r.isConstrained();
				data.g = this.g.isConstrained();
				data.b = this.r.isConstrained();
				data.h = this.h.isConstrained();
				data.s = this.s.isConstrained();
				data.l = this.l.isConstrained();
				data.a = this.a.isConstrained();
				return data;
			},

			/* getConstraint
			 * returns object containing all constraints
			 */
			getConstraint: function() {
				var self = this.getSelfConstraint();
				if (self) {
					return self;
				} else {
					var data = {};

					var r = this.r.getConstraint();
					var g = this.g.getConstraint();
					var b = this.r.getConstraint();
					var h = this.h.getConstraint();
					var s = this.s.getConstraint();
					var l = this.l.getConstraint();
					var a = this.a.getConstraint();
					if (r) {
						data.r = r;
					}
					if (g) {
						data.g = g;
					}
					if (b) {
						data.b = b;
					}
					if (h) {
						data.h = h;
					}
					if (s) {
						data.s = s;
					}
					if (l) {
						data.l = l;
					}
					if (a) {
						data.a = a;
					}
					if (r || g || b || h || s || l || a) {
						return data;
					}
				}
			},


			/* setValue
			 * defaults to setting via HSB, need to figure out a flag for mo
			 */
			setValue: function(color) {
				if (color.noColor) {
					this.setNoColor(color.noColor);
					if (this.setMode === 'hsb') {
						this.setValueHSB({
							h: -1,
							s: -1,
							b: -1
						});
					} else {
						this.setValueRGB({
							r: -1,
							g: -1,
							b: -1
						});
					}
				} else {
					this.setNoColor(false);
					if (color.a) {
						this.setA(color.a);
					}
					if (this.setMode === 'hsb') {
						this.setValueHSB(color);
					} else {
						this.setValueRGB(color);
					}
				}
				this.setNull(false);
			},

			/* setValue
			 * defaults to setting via HSB, need to figure out a flag for mo
			 */
			add: function(color) {
				this.setNoColor(false);
				if (color.a) {
					this.setA(color.a + this.getA());
				}

				if (this.setMode === 'hsb') {
					if (color.h) {
						this.setValue(this.getH() + color.h);
					}
					if (color.s) {
						this.setValue(this.getS() + color.s);
					}
					if (color.l) {
						this.setValue(this.getL() + color.l);
					}
				} else {
					if (color.r) {
						this.setValue(this.getR() + color.r);
					}
					if (color.g) {
						this.setValue(this.getG() + color.g);
					}
					if (color.b) {
						this.setValue(this.getB() + color.b);
					}
				}
				this.setNull(false);
			},

			setValueRGB: function(color) {

				var isConstrained = this.isConstrained();
				if (isConstrained.h || isConstrained.s || isConstrained.l) {
					return;
				}
				var neg = false;
				if (color.r) {
					this.setR(color.r, true);
					if (color.r < 0) {
						neg = true;
					}
				}
				if (color.g) {
					this.setG(color.g, true);
					if (color.g < 0) {
						neg = true;
					}
				}
				if (color.b) {
					this.setB(color.b, true);
					if (color.b < 0) {
						neg = true;
					}
				}
				var hsl;
				if (neg) {
					hsl = [-1, -1, -1];
				} else {
					hsl = ColorUtils.rgbToHsl({
						r: this.getR(),
						g: this.getG(),
						b: this.getB()
					});

				}

				this.setH(hsl[0], true);
				this.setS(hsl[1], true);
				this.setL(hsl[2], true);


			},

			setValueHSB: function(color) {
				var isConstrained = this.isConstrained();
				if (isConstrained.r || isConstrained.g || isConstrained.b) {
					return;
				}
				var neg = false;
				if (color.h) {
					this.setH(color.h, true);
					if (color.h < 0) {
						neg = true;
					}
				}
				if (color.s) {
					this.setS(color.s, true);
					if (color.s < 0) {
						neg = true;
					}
				}
				if (color.l) {
					this.setL(color.l, true);
					if (color.l < 0) {
						neg = true;
					}
				}
				var rgb;
				if (neg) {
					rgb = [-1, -1, -1];
				} else {
					rgb = ColorUtils.hslToRgb(this.getH(), this.getS(), this.getL());

				}
				this.setR(rgb[0], true);
				this.setB(rgb[1], true);
				this.setG(rgb[2], true);
			},

			/* getValue
			 * returns an object with current rgba values as properties
			 */
			getValue: function() {
				if (!this.isSelfConstrained()) {
					return {
						r: this.getR(),
						g: this.getG(),
						b: this.getB(),
						h: this.getH(),
						s: this.getS(),
						l: this.getL(),
						a: this.getA(),
						noColor: this.getNoColor()
					};
				} else {
					return this.getSelfConstraint().getValue();
				}
			},

			/*get and set funcitons for rgba*/
			getR: function() {
				if (this.isSelfConstrained()) {
					return this.getSelfConstraint().getValue().r;
				} else {
					return this.r.getValue();
				}
			},

			getG: function() {
				if (this.isSelfConstrained()) {
					return this.getSelfConstraint().getValue().g;
				} else {
					return this.g.getValue();
				}
			},

			getB: function() {
				if (this.isSelfConstrained()) {
					return this.getSelfConstraint().getValue().b;
				} else {
					return this.b.getValue();
				}
			},

			getH: function() {
				if (this.isSelfConstrained()) {
					return this.getSelfConstraint().getValue().h;
				} else {
					return this.h.getValue();
				}
			},

			getS: function() {
				if (this.isSelfConstrained()) {
					return this.getSelfConstraint().getValue().s;
				} else {
					return this.s.getValue();
				}
			},

			getL: function() {
				if (this.isSelfConstrained()) {
					return this.getSelfConstraint().getValue().l;
				} else {
					return this.l.getValue();
				}
			},

			getA: function() {
				if (this.isSelfConstrained()) {
					return this.getSelfConstraint().getValue().a;
				} else {
					return this.a.getValue();
				}
			},

			getNoColor: function() {
				if (this.isSelfConstrained()) {
					return this.getSelfConstraint().getValue().noColor;
				} else {
					return this.noColor.getValue();
				}
			},

			setR: function(r, checkConstraint) {
				if (checkConstraint) {
					var isConstrained = this.isConstrained();
					if (isConstrained.h || isConstrained.s || isConstrained.l) {
						return;
					}
				}
				this.r.setValue(r);
				this.setNull(false);
			},

			setG: function(g, checkConstraint) {
				if (checkConstraint) {
					var isConstrained = this.isConstrained();
					if (isConstrained.h || isConstrained.s || isConstrained.l) {
						return;
					}
				}
				this.g.setValue(g);
				this.setNull(false);
			},

			setB: function(b, checkConstraint) {
				if (checkConstraint) {
					var isConstrained = this.isConstrained();
					if (isConstrained.h || isConstrained.s || isConstrained.l) {
						return;
					}
				}
				this.b.setValue(b);
				this.setNull(false);
			},

			setH: function(h, checkConstraint) {
				if (checkConstraint) {
					var isConstrained = this.isConstrained();
					if (isConstrained.r || isConstrained.g || isConstrained.b) {
						return;
					}
				}
				this.h.setValue(h);
				this.setNull(false);
			},

			setS: function(s, checkConstraint) {
				if (checkConstraint) {
					var isConstrained = this.isConstrained();
					if (isConstrained.r || isConstrained.g || isConstrained.b) {
						return;
					}
				}
				this.s.setValue(s);
				this.setNull(false);
			},

			setL: function(l, checkConstraint) {
				if (checkConstraint) {
					var isConstrained = this.isConstrained();
					if (isConstrained.r || isConstrained.g || isConstrained.b) {
						return;
					}
				}
				this.l.setValue(l);
				this.setNull(false);
			},

			setA: function(a) {
				this.a.setValue(a);
				this.setNull(false);
			},

			setNoColor: function(nc) {
				this.noColor.setValue(nc);
				this.setNull(false);
			},


			/*clone
			 * returns a static clone based on the current values of the point
			 * does not clone the constraints of the original
			 */
			clone: function() {
				return new PColor(this.getR(), this.getG(), this.getB(), this.getA());
			},
			/*toPaperColor
			 * returns a paper.js color object based on the current
			 * values of this object
			 */
			toPaperColor: function() {

				return new paper.Color(this.getR(), this.getG(), this.getB(), this.getA());
			},


			toJSON: function() {
				var data = this.getValue();
				data.type = 'PColor';
				return data;
			},


		});


		return PColor;
	});