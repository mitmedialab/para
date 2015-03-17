/*FunctionNode.js
 * Node which stores a user-defined function
 */


define([
		'underscore',
		'paper',
		'models/data/Instance',
		'utils/PConstraint',
	],


	function(_, paper, Instance, PConstraint) {
		var svgstring = '<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 612 792" enable-background="new 0 0 612 792" xml:space="preserve"><g><path fill="none" stroke="#76787B" stroke-width="1.6375" stroke-miterlimit="10" d="M10,1.9c0,0-3.7,4-10,4s-10-4-10-4 s3.7-7.7,10-7.7S10,1.9,10,1.9z"/><ellipse fill="#76787B" cx="-0.3" cy="-0.9" rx="4.8" ry="5"/></g></svg>';
		var FunctionNode = Instance.extend({


			defaults: _.extend({}, Instance.prototype.defaults, {
				name: 'function',
				type: 'function',
				f_name: '',
				f_parameters: null,
				f_arguments: null,
				open: false,
				called: false,
			}),

			initialize: function() {
				Instance.prototype.initialize.apply(this, arguments);
				this.set('f_parameters', []);
				this.set('f_arguments', []);
				this.get('translation_delta').setNull(false);
				var rectangle = new paper.Rectangle(new paper.Point(0, 0), new paper.Size(100, 100));
				var path = new paper.Path.Rectangle(rectangle);
				path.strokeColor = this.get('primary_selection_color');
				path.fillColor = 'black';
				path.name = 'box';
				var eye = new paper.Group();
				eye.importSVG(svgstring);
				eye.position.x = 15;
				eye.position.y = 90;
				eye.name = 'eye';
				this.nameText = new paper.PointText({
					point: new paper.Point(5, 13),
					content: 'foo',
					justification: 'left',
					fontSize: 12,
					fontFamily: 'Source Sans Pro',
					fillColor: this.get('primary_selection_color')
				});

				var geom = new paper.Group();
				geom.addChild(path);
				geom.addChild(eye);
				geom.addChild(this.nameText);
				this.nameText.data.instance = geom.data.instance = path.data.instance = eye.data.instance = this;
				this.set('geom', geom);
				this.lists = [];
				this.functions = [];

			},


			addParameter: function(param) {
				this.get('f_parameters').push(param);
				if (this.children.indexOf(param) === -1) {
					this.addChildNode(param);
				}
			},

			open: function() {
				this.set('open', true);
				for (var i = 0; i < this.children.length; i++) {
					this.children[i].show();
				}
				return this.children;
			},

			close: function() {
				this.set('open', false);
				for (var i = 0; i < this.children.length; i++) {
					this.children[i].close();
					this.children[i].hide();
				}
				return this.getParentNode();
			},

			call: function() {
				this.set('called', true);
				for (var i = 0; i < this.children.length; i++) {
					this.children[i].show();
				}
			},

			uncall: function() {
				this.set('called', false);
				for (var i = 0; i < this.children.length; i++) {
					this.children[i].hide();
				}
			},

			compile: function() {
				var open = this.get('open');
				var called = this.get('called');
				var params = this.get('f_parameters');
				 var args = this.get('f_arguments');
				if (!open && called) {
					for (var i = 0; i < params.length; i++) {
						if (args.length > i) {
							params[i].set('visible',true);
						} else {
							params[i].set('visible',false);
						}
					}
				} else if (open) {
					this.children.forEach(function(child) {
						child.set('visible', true);
					});
				}
			},

			render: function() {
				var geom = this.get('geom');
				var open = this.get('open');
				if (!open) {
					geom.visible = true;
					geom.position = this.get('translation_delta').toPaperPoint();
					this.nameText.content = this.get('f_name');
					this.renderSelection(geom.children['box']);
					if (this.get('called')) {
						geom.children['eye'].visible = true;
					} else {
						geom.children['eye'].visible = false;
					}
				} else {
					geom.visible = false;
				}

			}

		});

		return FunctionNode;
	});