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
		'utils/PFloat',
		'utils/PConstraint',
		'utils/ColorUtils'
	],

	function(_, paper, cjs, PFloat, PConstraint, ColorUtils) {

		var PColor = PConstraint.extend({

			defaults: _.extend({}, PConstraint.prototype.defaults, {
				name: 'PColor',
				dimension_num: 3
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
				var h = this.h;
				this.listenTo(this.h,'change',function(val){
					console.log('setting value for color', val, h.isConstrained(), h.getValue());

				});
				this.setMode = 'hsb';
				PConstraint.apply(this, arguments);

				if (operator) {
					this.set('operator', operator);
				} else {
					this.set('operator', 'set');
				}
				this.setNull(false);
			},

			/* isConstrained
			 * returns object with booleans for each property based on constraint status
			 */
			isConstrained: function() {
				var data = {};
				data.self = this.isSelfConstrained();
				data.r = this.r.isConstrained().self;
				data.g = this.g.isConstrained().self;
				data.b = this.r.isConstrained().self;
				data.h = this.h.isConstrained().self;
				data.s = this.s.isConstrained().self;
				data.l = this.l.isConstrained().self;
				data.a = this.g.isConstrained().self;
				return data;
			},

			/* getConstraint
			 * returns object containing all constraints
			 */
			getConstraint: function() {
				var data = {};
				data.self = this.getSelfConstraint();
				data.r = this.r.getConstraint().self;
				data.g = this.g.getConstraint().self;
				data.b = this.r.getConstraint().self;
				data.h = this.h.getConstraint().self;
				data.s = this.s.getConstraint().self;
				data.l = this.l.getConstraint().self;
				data.a = this.g.getConstraint().self;

				return data;
			},


			/* setValue
			 * defaults to setting via HSB, need to figure out a flag for mo
			 */
			setValue: function(color) {
				if (color.a) {
					this.setA(color.a);
				}
				if (this.setMode === 'hsb') {
					this.setValueHSB(color);
				} else {
					this.setValueRGB(color);
				}
			},

			setValueRGB: function(color) {

				var isConstrained = this.isConstrained();
				if (isConstrained.h || isConstrained.s || isConstrained.l) {
					return;
				}
				this.setR(color.r, true);
				this.setG(color.g, true);
				this.setB(color.b, true);
				var hsl = ColorUtils.rgbToHsl({
					r: this.getR(),
					g: this.getG(),
					b: this.getB()
				});
				this.setH(hsl[0], true);
				this.setS(hsl[1], true);
				this.setL(hsl[2], true);


			},

			setValueHSB: function(color) {

				console.trace();
				var isConstrained = this.isConstrained();
				if (isConstrained.r || isConstrained.g || isConstrained.b) {
					return;
				}
				this.setH(color.h, true);
				this.setS(color.s, true);
				this.setL(color.l, true);
				var rgb = ColorUtils.hslToRgb(this.getH(), this.getS(), this.getL());
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
						a: this.getA()
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

			/* modify
			 * converts hex values to color values
			 * calls super modify following this conversion
			 */
			modifyProperty: function(style_data) {
				var r = ColorUtils.hexToR(style_data);
				var g = ColorUtils.hexToG(style_data);
				var b = ColorUtils.hexToB(style_data);
				var hsl = ColorUtils.rgbToHsl({
					r: r,
					g: g,
					b: b
				});
				var data = {
					operator: 'set',
					r: r,
					g: g,
					b: b,
					h: hsl[0],
					s: hsl[1],
					l: hsl[2]
				};
				PConstraint.prototype.modifyProperty.call(this, data);
			},

			toJSON: function() {
				var data = this.getValue();
				data.type = 'PColor';
				return data;
			},


		});


		return PColor;
	});