/*ImportToolModel.js
 * imports in shapes from svg files to canvas
 */

define([
	'underscore',
	'backbone',
	'models/tools/BaseToolModel',
	'models/data/PathNode',
	'models/PaperManager'

], function(_, Backbone, BaseToolModel, PathNode, PaperManager) {

	var ImportToolModel = BaseToolModel.extend({

	initialize: function(){

	},

	import: function( filename){
		var paper = PaperManager.getPaperInstance();
			var files = filename
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				if (file.type.match('svg')) {
					paper.project.importSVG(file, function(item) {
						//console.log(item);
					});
				}
			}
		});
	}


	});

	return SelectToolModel;

});