/*SaveExportView
 *Handles save and export interactions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',

], function($, _, Backbone, Handlebars) {

	var currentName;
	var SaveExportView = Backbone.View.extend({

		events: {
			'click #save': 'save',
			'click #saveas': 'saveAs',
			'click #downloadFile': 'downloadFile',
			'click #export': 'exportSVG',
			'click #import': 'importSVG',
			//'change #text-filename': 'nameChange',
			'change #uploadFile': 'uploadFile',
			//'change #fileselect': 'load',
		},

		initialize: function() {
			this.enable('save');
			this.enable('saveas');
			this.enable('downloadFile');
			this.enable('export');
			this.enable('import');
			this.enable('uploadFile');

		},

		enable: function(type) {
			if ($('#' + type).is(':disabled')) {
				$('#' + type).removeAttr('disabled');
			}

		},

		disable: function(type) {
			if (!$('#' + type).is(':disabled')) {
				document.getElementById(type).disabled = true;
			}
		},

		promptName: function() {

			var name = prompt("Please enter a name for your file", "");

			if (name !== null) {
				if (name !== "") {
					return name;
				} else {
					alert('no name entered, file will not be saved');
				}
			}
		},

		addFileToSelect: function(filename) {
			var select = $("#fileselect");

			var exists = false;
			$('#fileselect option').each(function() {
				if (this.text === filename) {
					exists = true;
					return false;
				}
			});
			if (!exists) {
				var val = select.size();
				select.append($('<option>', {
					value: val,
					text: filename
				}));
				return true;
			} else {
				return false;
			}

		},

		save: function() {
			if (!currentName) {
				var name = this.promptName();
				if (!name) {
					return;
				} else {
					var added = this.addFileToSelect(name);
					if (!added) {
						if (!confirm("this will overwrite the file " + name)) {
							return;
						}
					}
					currentName = name;
					$('#fileselect option').filter(function() {
						return $(this).text() == currentName;
					}).prop('selected', true);

				}
			}
			var project_json = this.model.exportProjectJSON();
			console.log('project_json=', project_json);
			var data = JSON.stringify(project_json);
			localStorage.setItem(currentName, data);
			console.log('saved-data', JSON.parse(localStorage.getItem(currentName)));
			return project_json;

		},

		saveAs: function() {
			currentName = null;
			this.save();

		},



		loadLocal: function(filename) {
			var data = localStorage.getItem(filename);
			this.load(JSON.parse(data));
		},


		/*
		  load: function() {
      var id = $('#fileselect option:selected').val();
      var filename = $('#fileselect option:selected').text();
      this.model.loadLocal(id);
      $('#text-filename').val(filename);
    },

    */



		downloadFile: function() {


		},

		exportSVG: function() {
			console.log('export svg');

		},

		importSVG: function() {
			console.log('import svg');

		},

		uploadFile: function(event) {
			var file = event.target.files[0];

			this.listenToOnce(this, 'loadComplete', function(result) {
				console.log('upload file', result);


			});
			this.completeFileLoad(file);

		},


		completeFileLoad: function(file) {
			var reader = new FileReader();
			reader.parent = this;
			reader.onload = (function(theFile) {

				return function(e) {
					//this.parent.load(JSON.parse(e.target.result));
					this.parent.trigger('loadComplete', e.target.result);
					//paper.view.zoom = this.parent.zeroedZoom;
					//paper.view.center = this.parent.zeroedPan.clone();
				};
			})(file);
			reader.readAsText(file);
		},



	});
	return SaveExportView;
});