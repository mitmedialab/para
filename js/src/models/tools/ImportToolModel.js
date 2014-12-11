/*ImportToolModel.js
 * imports in shapes from svg files to canvas
 */

define([
	'underscore',
	'paper',
	'backbone',
	'models/tools/BaseToolModel',
	'models/data/PathNode',

], function(_, paper, Backbone, BaseToolModel, PathNode) {

	var ImportToolModel = BaseToolModel.extend({

	initialize: function(){

	},

	import: function( filename){
			var files = filename;
			for (var i = 0; i < files.length; i++) {
				var file = files[i];
				if (file.type.match('svg')) {
					paper.project.importSVG(file, function(item) {
						//console.log(item);
					});
				}
			}
		}
	

	});

	return ImportToolModel;

});