/* MapView.js
 * controls updates to the layers menu
 */

define([
	'jquery',
	'underscore',
	'paper',
	'backbone',
	'handlebars',
	'utils/TrigFunc',
	"text!html/map_ui.html"

], function($, _, paper, Backbone, Handlebars, TrigFunc, ui) {
	var mapPaperView, functionPath, intersectionPath, start, end, startPoint, endPoint, tool, master_tool, activePoint, self;
	var width = 175;
	var height = 175;
	var min = 1;
	var max = 10;
	var range = 10;
	var hitOptions = {
		segments: true,
		curves: true,
		center: true,
		fill: true,
		tolerance: 4
	};

 var prop_map = {
    position:{min:0,max:1000},
    scale:{min:0,max:5},
    rotation:{min:0,max:360},
    h:{min:0,max:360},
    s:{min:0,max:1},
    l:{min:0,max:1},
    fill:{min:0,max:255},
    stroke:{min:0,max:255},
  };


	var lagrange_pts = [];
	var MapView = Backbone.View.extend({

		events: {
			'mouseenter': 'mouseEnter',
			'mouseleave': 'mouseLeave',
			'change #min': 'minChange',
			'change #max': 'maxChange'
		},

		initialize: function(obj) {
			$("body").append(ui);
			self = this;
			this.setElement($('#collection-mapper'));

			paper.setup($('#collection-canvas')[0]);
			mapPaperView = paper.View._viewsById['collection-canvas'];
			intersectionPath = new paper.Path.Line(new paper.Point(width / 2, 0), new paper.Point(width / 2, height));
			intersectionPath.name = 'intersectionPath';


			startPoint = new paper.Path.Circle(new paper.Point(0, 0), 4);
			startPoint.name = 'start_point';
			endPoint = new paper.Path.Circle(new paper.Point(0, 0), 4);
			endPoint.name = 'end_point';
			startPoint.fillColor = endPoint.fillColor = new paper.Color(0, 0, 0);
			startPoint.visible = endPoint.visible = false;
			mapPaperView.draw();

			master_tool = paper.tools[0];
			tool = new paper.Tool();
			tool.name = 'map_tool';
			tool.parent = this;
			tool.attach('mousedrag', this.toolMouseDrag);
			tool.attach('mousedown', this.toolMouseDown);
			tool.attach('mouseup', this.toolMouseUp);
			tool.activate();


			this.resetMasterView();
			this.setMin();
			this.setMax();
			this.setRange();
			this.setToDefault();
			lagrange_pts.push(new paper.Point(0, 0));
			lagrange_pts.push(new paper.Point(width, height));

		},

		setToDefault: function() {
			this.setCollectionView();
			//start.point.x = 0;
			//start.point.y = height / 2;
			//end.point.x = width;
			//end.point.y = height / 2;
			mapPaperView.draw();
			this.resetMasterView();
		},

		setConstraint: function(constraint) {
			this.setFunctionPath(constraint.getFunctionPath());
			var cmin = constraint.getMin();
			var cmax = constraint.getMax();
			var relProps = constraint.get('rel_prop').split('_');
			var prop = relProps[0];
			var subprop = relProps.length>1?relProps[1]:null;
			if(subprop){
				if(subprop.length===1&& (subprop=='h'||subprop=='s'||subprop=='b')){
					prop = subprop;
				}
			}
			if(!cmin){
				cmin = prop_map[prop].min;
			}
			if(!cmax){
				cmax = prop_map[prop].max;
			}
			this.setRange(constraint.getRange());
			this.setMin(cmin);
			this.setMax(cmax);
		},

		deactivate: function() {
			this.setFunctionPath();
			this.setMin();
			this.setMax();
			this.setRange();

		},

		setFunctionPath: function(path) {
			this.setCollectionView();
			if (functionPath) {
				functionPath.remove();
				startPoint.visible = endPoint.visible = false;
			}
			if (path) {
				functionPath = path;
				var poly = TrigFunc.Lagrange(lagrange_pts);
				start = functionPath.segments[0];
				end = functionPath.segments[functionPath.segments.length - 1];
				startPoint.visible = endPoint.visible = true;
				startPoint.position = functionPath.getPointAt(3);
				endPoint.position = functionPath.getPointAt(functionPath.length - 3);
				paper.project.layers[0].addChild(functionPath);
				functionPath.sendToBack();
			}
			mapPaperView.draw();
			this.resetMasterView();
		},

		calculateValue: function(_index, _range, _min, _max, _function) {
			if (_index > _range - 1) {
				console.log('! ERROR: index is outside of range !');
				return;
			}
			var xval = (_index / _range) * width;
			intersectionPath.firstSegment.point.x = xval;
			intersectionPath.lastSegment.point.x = xval;
			var intersections = intersectionPath.getIntersections(_function);
			if (intersections.length > 0) {
				if (intersections.length > 1) {
					console.log('! MORE THAN ONE INTERSECTION DETECTED !');
				}
				var intersection = intersections[0].point;
				var value = TrigFunc.map(intersection.y, height, 0, _min, _max);
				return value;
			}
		},

		calculateValueSet: function(constraint) {
			var values = [];
			var c_range, c_function, c_min, c_max;
			if (constraint) {
				c_range = constraint.getRange();
				c_function = constraint.getFunctionPath();
				c_min = constraint.getMin();
				c_max = constraint.getMax();
			} else {
				c_range = range;
				c_function = functionPath;
				c_min = min;
				c_max = max;
			}
			for (var i = 0; i < c_range; i++) {
				values.push(this.calculateValue(i, c_range, c_min, c_max, c_function));
			}
			return values;
		},

		setMin: function(val) {
			if (val!== undefined) {
				min = val;
				$('#min').val(min);
				this.enable('min');
			} else {
				$('#min').val("");
				this.disable('min');

			}
		},

		setMax: function(val) {
			if (val!== undefined) {
				max = val;
				$('#max').val(max);
				this.enable('max');
			} else {
				$('#max').val("");
				this.disable('max');

			}
		},

		disable: function(type) {
			if (!$('#' + type).is(':disabled')) {
				document.getElementById(type).disabled = true;
			}
		},

		enable: function(type) {
			if ($('#' + type).is(':disabled')) {
				$('#' + type).removeAttr('disabled');
			}

		},



		minChange: function(event) {
			var minVal = $('#min').val();
			var maxVal = $('#max').val();
			var value = this.verifyNumeric(minVal);
			if (value) {
				min = +minVal;
				this.model.updateMinMax(+minVal, +maxVal, this.calculateValueSet());
			} else {
				alert('please enter a number');
				$('#min').val(min);
			}
		},

		maxChange: function(event) {
			var minVal = $('#min').val();
			var maxVal = $('#max').val();
			var value = this.verifyNumeric(maxVal);
			if (value) {
				max = +maxVal;
				this.model.updateMinMax(+minVal, +maxVal, this.calculateValueSet());
			} else {
				alert('please enter a number');
				$('#max').val(max);
			}
		},

		verifyNumeric: function(value) {
			return !isNaN(value);
		},

		setRange: function(val) {
			$('#xaxis-list').empty();
			if (val) {
				range = val;
				var mod_range, multiplier;
				if (range > 15 && range < 150) {
					mod_range = 10;
					multiplier = range / mod_range;
				} else if (range > 150) {
					mod_range = 5;
					multiplier = range / mod_range;
				} else {
					mod_range = range;
					multiplier = 1;
				}
				var items = [];
				$('#xaxis-list').empty();
				for (var i = 0; i < mod_range; i++) {
					items.push('<li>' + (Math.round((i + 1) * multiplier)) + '</li>');
				}
				$('#xaxis-list').append(items.join(''));
			}
		},


		resetMasterView: function() {
			var view = paper.View._viewsById['canvas'];

			if (!view) {
				return;
			}
			master_tool.activate();
			view._project.activate();
		},

		setCollectionView: function() {
			tool.activate();
			mapPaperView._project.activate();
		},

		mouseEnter: function() {
			this.setCollectionView();
			//functionPath.fullySelected = true;

		},

		mouseLeave: function() {
			this.resetMasterView();
			activePoint = null;
		},

		toolMouseUp: function(event) {
			activePoint = null;

		},

		toolMouseDown: function(event) {
			var hitResult = paper.project.hitTest(event.point, hitOptions);
			if (hitResult) {
				if (hitResult.item === endPoint) {
					activePoint = end;
				} else if (hitResult.item === startPoint) {
					activePoint = start;
				} else {
					switch (hitResult.type) {
						case 'segment':
						case 'handle-in':
						case 'handle-out':
							activePoint = hitResult.segment;
							break;
						case 'curve':
							//console.log('hit detected',event.point);
							//lagrange_pts.push(event.point);
							//this.setFunctionPath(functionPath);
							/*var curve = hitResult.location.curve;
							var curveOffset = hitResult.location.curveOffset;
							activePoint = curve.divide(curveOffset).segment1;
							console.log('hit curve');*/
							break;
					}
				}
			}

		},

		toolMouseDrag: function(event) {

			if (activePoint) {
				activePoint.point.y = activePoint.point.y + event.delta.y;

				if (activePoint !== start && activePoint !== end) {
					activePoint.point.x = activePoint.point.x + event.delta.x;
				}
				if (activePoint.point.x < 0) {
					activePoint.point.x = 0;
				}
				if (activePoint.point.y < 0) {
					activePoint.point.y = 0;
				}
				if (activePoint.point.x > width) {
					activePoint.point.x = width;
				}
				if (activePoint.point.y > height) {
					activePoint.point.y = height;
				}
				startPoint.position = functionPath.getPointAt(3);
				endPoint.position = functionPath.getPointAt(functionPath.length - 3);
				self.resetMasterView();
				self.model.updateMapping(self.calculateValueSet());
				self.setCollectionView();
			}



		},

	});
	return MapView;
});