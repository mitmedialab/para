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
	var mapView, functionPath, intersectionPath,start,end;
	var width = 175;
	var height = 175;
	var min = -10;
	var max = 10;
	var range = 500;
	var MapView = Backbone.View.extend({

		events: {
			'mousedown.filled': 'argumentClicked',
		},

		initialize: function(obj) {
			$("body").append(ui);

			this.setElement($('#collection-mapper'));
			console.log('paper =',paper);
			
			paper.setup($('#collection-canvas')[0]);
			mapView = paper.View._viewsById['collection-canvas'];

			start = new paper.Point(0,height);
			end = new paper.Point(width,0);
			functionPath = new paper.Path.Line(start,end);
			intersectionPath = new paper.Path.Line(new paper.Point(width/2,0),new paper.Point(width/2,height));
			functionPath.strokeColor = new paper.Color(0,0,0);
			functionPath.strokeWidth = 2;
			//intersectionPath.strokeColor =  new paper.Color(0,0,0);
			//intersectionPath.strokeWidth = 2;	
			console.log('functionPath',functionPath,'intersectionPath',intersectionPath);
			console.log(mapView);
			mapView.draw();

			
			//  var canvas = e.event.toElement.id;
			this.resetMasterView();
			this.setMin(min);
			this.setMax(max);
			this.setRange(range);

			for(var i=0;i<range;i++){
				this.calculateValue(i);
			}


		},

		calculateValue:function(index){
			if(index>range-1){
				console.log('! ERROR: index is outside of range !');
				return;
			}
			var xval = (index/range)*width;
			intersectionPath.firstSegment.point.x = xval;
			intersectionPath.lastSegment.point.x = xval;
			var intersections = intersectionPath.getIntersections(functionPath);
			if(intersections.length>0){
				if(intersections.length>1){
					console.log('! MORE THAN ONE INTERSECTION DETECTED !');
				}
				var intersection = intersections[0].point;
				var value = TrigFunc.map(intersection.y,height,0,min,max);
				console.log('intersection calculated here:',intersection, 'value:',value);
				return value;
			}
		},



		setMin:function(val){
			min = val;
			$('#min').val(min);
		},

		setMax: function(val){
				max = val;
			$('#max').val(max);
		},

		setRange: function(val){
			range = val;
			var mod_range,multiplier;
			if(range>15 && range<150){
				mod_range = 10;
				multiplier= range/mod_range;
			}
			else if(range>150){
				mod_range = 5;
				multiplier= range/mod_range;
			}

			else{
				mod_range = range;
				multiplier = 1;
			}
			var items = [];
			$('#xaxis-list').empty();
			for(var i=0;i<mod_range;i++){
 				items.push('<li>' + (i*multiplier) + '</li>');
			}
			$('#xaxis-list').append(items.join(''));
		},


		resetMasterView: function(){
			 var view = paper.View._viewsById['canvas'];
            if (!view){
                return;
            }
            view._project.activate();
		},

		setCollectionView: function(){
			mapView._project.activate();
		},

		});
	return MapView;
});