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
	var mapView, functionPath, intersectionPath, start, end, startPoint, endPoint, tool, master_tool, activePoint, self;
	var width = 175;
	var height = 175;
	var min = -1.5;
	var max = 1.5;
	var range = 10;
	var hitOptions = {
		segments: true,
		curves: true,
		handles: true, //necessary?
		center: true,
		fill: true,
		tolerance: 4
	};
	var MapView = Backbone.View.extend({

		events: {
			'mouseenter': 'mouseEnter',
			'mouseleave': 'mouseLeave'
		},

		initialize: function(obj) {
			$("body").append(ui);
			self = this;
			this.setElement($('#collection-mapper'));

			paper.setup($('#collection-canvas')[0]);
			mapView = paper.View._viewsById['collection-canvas'];
			intersectionPath = new paper.Path.Line(new paper.Point(width / 2, 0), new paper.Point(width / 2, height));
			intersectionPath.name = 'intersectionPath';

		
			//startPoint = new paper.Path.Circle(start.point, 4);
			//startPoint.name = 'start_point';
			//endPoint = new paper.Path.Circle(end.point, 4);
			//endPoint.name = 'end_point';
			//startPoint.fillColor = endPoint.fillColor = new paper.Color(0, 0, 0);
			//startPoint.visible = endPoint.visible = false;
			mapView.draw();

			master_tool = paper.tools[0];
			tool = new paper.Tool();
			tool.name = 'map_tool';
			tool.parent = this;
			tool.attach('mousedrag', this.toolMouseDrag);
			tool.attach('mousedown', this.toolMouseDown);
			tool.attach('mouseup', this.toolMouseUp);
			tool.activate();


			this.resetMasterView();
			this.setMin(min);
			this.setMax(max);
			this.setRange(range);
			this.setToDefault();

		},

		setToDefault: function() {
			this.setCollectionView();
			//start.point.x = 0;
			//start.point.y = height / 2;
			//end.point.x = width;
			//end.point.y = height / 2;
			if(startPoint){
			startPoint.position = start.point;
			endPoint.position = end.point;
			}
			mapView.draw();
			this.resetMasterView();
		},

		setConstraint:function(constraint){
			this.setFunctionPath(constraint.getFunctionPath());
			this.setMin(constraint.getMin());
			this.setMax(constraint.getMax());
			this.setRange(constraint.getRange());

		},

		setFunctionPath: function(path){
			this.setCollectionView();
			if(functionPath){
				functionPath.remove();
			}
			functionPath = path;
			start = functionPath.segments[0];
			end = functionPath.segments[functionPath.segments.length-1];
			paper.project.layers[0].addChild(functionPath);
			mapView.draw();
			this.resetMasterView();
		},

		calculateValue: function(index) {
			if (index > range - 1) {
				console.log('! ERROR: index is outside of range !');
				return;
			}
			var xval = (index / range) * width;
			intersectionPath.firstSegment.point.x = xval;
			intersectionPath.lastSegment.point.x = xval;
			var intersections = intersectionPath.getIntersections(functionPath);
			if (intersections.length > 0) {
				if (intersections.length > 1) {
					console.log('! MORE THAN ONE INTERSECTION DETECTED !');
				}
				var intersection = intersections[0].point;
				var value = TrigFunc.map(intersection.y, height, 0, min, max);
				return value;
			}
		},

		calculateValueSet: function() {
			var values = [];
			for (var i = 0; i < range; i++) {
				values.push(this.calculateValue(i));
			}
			return values;
		},

		setMin: function(val) {
			min = val;
			$('#min').val(min);
		},

		setMax: function(val) {
			max = val;
			$('#max').val(max);
		},

		setRange: function(val) {
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
				items.push('<li>' + (i * multiplier) + '</li>');
			}
			$('#xaxis-list').append(items.join(''));
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
			mapView._project.activate();
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
				switch (hitResult.type) {
					case 'segment':
					case 'handle-in':
					case 'handle-out':
						activePoint = hitResult.segment;
						console.log('hit segment');
						break;
					case 'curve':
						/*var curve = hitResult.location.curve;
						var curveOffset = hitResult.location.curveOffset;
						activePoint = curve.divide(curveOffset).segment1;
						console.log('hit curve');*/
						break;
				}
			}
		},

		toolMouseDrag: function(event) {
		
			if (activePoint) {
				activePoint.point.y = activePoint.point.y + event.delta.y;

				if(activePoint!==start && activePoint!==end){
					activePoint.point.x = activePoint.point.x + event.delta.x;
				}
				if(activePoint.point.x<0){activePoint.point.x=0;}
			if(activePoint.point.y<0){activePoint.point.y=0;}
			if(activePoint.point.x>width){activePoint.point.x=width;}
			if(activePoint.point.y>height){activePoint.point.y=height;}
			self.resetMasterView();
			self.trigger('mappingChanged',self.calculateValueSet());
			self.setCollectionView();
			}



		},

	});
	return MapView;
});