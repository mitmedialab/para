/*SaveExportView
 *Handles save and export interactions
 */
define([
	'jquery',
	'underscore',
	'backbone',
	'handlebars',
	'filesaver'

], function($, _, Backbone, Handlebars, FileSaver) {

	var currentName, unsavedChanges;
	var SaveExportView = Backbone.View.extend({

		events: {
			'click #save': 'save',
			'click #saveas': 'saveAs',
			'click #downloadFile': 'downloadFile',
			'click #export': 'exportSVG',
			'change #importSVG': 'importSVG',
			//'change #text-filename': 'nameChange',
			'change #uploadFile': 'uploadFile',
			'change #fileselect': 'loadLocal',
		},

		initialize: function() {
			unsavedChanges = false;
			this.enable('saveas');
			this.enable('downloadFile');
			this.enable('export');
			this.enable('import');
			this.enable('uploadFile');
			this.listenTo(this.model, 'modified', this.enableSave);
			$('#uploadFile').on('click', function() { $('#uploadFile').val(''); });

		},

		enableSave: function() {
			this.enable('save');
			unsavedChanges = true;
		},

		disableSave: function() {
			this.disable('save');
			unsavedChanges = false;
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
				select.append($('<option>', {
					value: filename,
					text: filename
				}));
				return true;
			} else {
				return false;
			}

		},

		save: function(event, data) {
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
			if (!data) {
				data = this.model.exportProjectJSON();
			}
			var string_data = JSON.stringify(data);
			console.log('setting data', currentName, data);
			localStorage.removeItem(currentName);
			try {
				localStorage.setItem(currentName, string_data);
			} catch (e) {
				console.log("LIMIT REACHED:", string_data);
				console.log(e);
			}
			this.disableSave();
			//console.log('localStorageSet',localStorage);

			return true;
		},

		saveAs: function(event, data) {
			currentName = null;
			return this.save(null, data);

		},



		load: function(filename) {

			//this.save();
			var data = localStorage.getItem(filename);
			var data_obj = JSON.parse(data);
			console.log('loading filename', filename, data_obj);
			this.model.importProjectJSON(data_obj);
			currentName = filename;
		},


		loadLocal: function() {
			if (unsavedChanges) {
				if (!confirm("you have unsaved changes, do you wish to continue?" + name)) {
					$('#text-filename').val(currentName);
					return;
				}
			}
			var filename = $('#fileselect option:selected').val();
			this.load(filename);
			$('#text-filename').val(filename);
		},


		downloadFile: function() {

			if (!currentName) {
				var name = this.promptName();
				if (!name) {
					return;
				}
				currentName = name;
			}
			var data = JSON.stringify(this.model.exportProjectJSON());
			var blob = new Blob([data], {
				type: 'text/plain;charset=utf-8'
			});
			var fileSaver = new FileSaver(blob, currentName);
		},

		exportSVG: function() {
			/*if (!currentName) {
				var name = this.promptName();
				if (!name) {
					return;
				}
				currentName = name;
			}*/
			var data = this.model.exportSVG();
			var blob = new Blob([data], {
				type: 'image/svg+xml'
			});
			var fileSaver = new FileSaver(blob, currentName);
		},

		importSVG: function(event) {
			var file = event.target.files[0];

			this.listenToOnce(this, 'loadComplete', function(result) {
				this.model.importSVG(result);

			});
			this.completeFileLoad(file);

		},

		uploadFile: function(event) {
			if (unsavedChanges) {
				if (!confirm("you have unsaved changes, do you wish to continue?" + name)) {
					$('#text-filename').val(currentName);
					return;
				}
			}
			var file = event.target.files[0];

			this.listenToOnce(this, 'loadComplete', function(result) {
				var saved = this.saveAs(null, JSON.parse(result));
				if(saved){
					this.load(currentName);
				}


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