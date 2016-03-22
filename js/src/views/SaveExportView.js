/*SaveExportView
 *Handles save and export interactions
 */
define([
	'jquery',
	'jquery-ui',
	'underscore',
	'backbone',
	'handlebars',
	'filesaver',
	'utils/analytics',
	"text!html/ui_dialog.html"

], function($, ui, _, Backbone, Handlebars, FileSaver, analytics, ui_html) {


	var currentName, unsavedChanges, ui_form, allFields, working, difficult, self, sampleTimer;
	var SAMPLE_INTERVAL = 3000;//120000; // starts at 2 minutes
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
			$('#uploadFile').on('click', function() {
				$('#uploadFile').val('');
			});
			$("body").append(ui_html);
			self = this;

			working = $("#working");
			difficult = $("#difficult");
			allFields = $([]).add(working).add(difficult);
			ui_form = $("#dialog-form").dialog({
				autoOpen: false,
				height: 400,
				width: 500,
				modal: true,
				buttons: {
					"submit": self.addSample
				},
				close: function() {
					allFields.removeClass("ui-state-error");
					self.calculateSampleInterval();
					self.model.trigger('unpauseKeyListeners');
					sampleTimer = setTimeout(self.triggerSampleDialog, SAMPLE_INTERVAL);
				}

			});
			sampleTimer = setTimeout(this.triggerSampleDialog, SAMPLE_INTERVAL);
		},

		triggerSampleDialog: function() {
			clearTimeout(sampleTimer);
			ui_form.dialog("open");
			self.model.trigger('pauseKeyListeners');
		},

		addSample: function() {
			var valid = true;
			allFields.removeClass("ui-state-error");

			if (valid) {
				var time = new Date();
				var exp_data = {};
				exp_data.workingOn = working.val();
				exp_data.difficult = difficult.val();
				exp_data.file = self.model.exportProjectJSON();

				ui_form.dialog("close");
				self.model.trigger('unpauseKeyListeners');
				console.log('exp_data=', exp_data);
				self.calculateSampleInterval();
				sampleTimer = setTimeout(self.triggerSampleDialog, SAMPLE_INTERVAL);
				analytics.log('experience_sample', {
					type: 'experience_sample',
					id: 'experience_sample' + time.getTime(),
					action: 'auto_sample_response',
					data: exp_data
				});


			}


		},


		calculateSampleInterval: function() {
			SAMPLE_INTERVAL = (Math.random() * 600000 * 2) + 600000;
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
			localStorage.removeItem(currentName);
			try {
				localStorage.setItem(currentName, string_data);
				this.disableSave();
				return true;

			} catch (e) {
				console.log("LIMIT REACHED:", e);
				console.trace();
				return false;
			}

		},

		saveAs: function(event, data) {
			currentName = null;
			return this.save(null, data);

		},



		load: function(filename) {

			//this.save();
			var data = localStorage.getItem(filename);
			var data_obj = JSON.parse(data);
			//console.log('data, data_obj',data,data_obj);

			this.loadJSON(data_obj);
			currentName = filename;
		},

		loadJSON: function(data_obj) {
			this.model.importProjectJSON(data_obj);
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
				var r = JSON.parse(result);
				if (r) {
					this.loadJSON(r);
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