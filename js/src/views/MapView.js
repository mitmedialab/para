/* MapView.js
 * controls updates to the layers menu
 */

define([
	'jquery',
	'underscore',
	'paper',
	'backbone',
	'handlebars',
	"text!html/map_ui.html"

], function($, _, paper, Backbone, Handlebars, ui) {
	var mapView, functionPath, intersectionPath,start,end;
	var width = 175;
	var height = 175;
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

			var start = new paper.Point(0,height);
			var end = new paper.Point(width,0);
			var functionPath = new paper.Path.Line(start,end);
			//var intersectionPath = new paper.Line(new paper.Point(width/2,0),(width/2,height));
			functionPath.strokeColor = new paper.Color(0,0,0);
			functionPath.strokeWidth = 2;
			console.log('functionPath',functionPath);
			console.log(mapView);
			mapView.draw();
			//  var canvas = e.event.toElement.id;
			this.resetMasterView();

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