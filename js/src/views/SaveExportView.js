/*SaveExportView
 *Handles save and export interactions
 */
define([
	'jquery',
	'jquery-ui',
	'underscore',
	'aws-sdk-js',
	'backbone',
	'handlebars',
	'filesaver',
	'utils/analytics',
	"text!html/ui_dialog.html"

], function($, ui, _, AWS, Backbone, Handlebars, FileSaver, analytics, ui_html) {


	var currentName, unsavedChanges, ui_form, allFields, working, difficult, self, sampleTimer, delayTimer, bucket, saved_params, s3;
	var SAMPLE_INTERVAL = 600000 * 2; // starts at 20 minutes
	var DELAY_INTERVAL = 300000; //delay interval of 5 minutes
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
			$('#sample_button').on("click", this.triggerSampleDialog);
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
					self.model.trigger('unpauseKeyListeners');
					delayTimer = setTimeout(self.triggerSampleDialog, DELAY_INTERVAL);
				}

			});
			sampleTimer = setTimeout(this.startDelay, SAMPLE_INTERVAL);
			AWS.config.region = 'us-east-1'; // Region
			var creds = new AWS.CognitoIdentityCredentials({
				IdentityPoolId: 'us-east-1:60d2d4f9-df27-47b2-bf73-c8b01736c9f4'
			});
			AWS.config.credentials = creds;


			saved_params = {
				Bucket: 'kimpara',
				Delimiter: '/',
				Prefix: 'saved_files/'
			};
			s3 = new AWS.S3();
			s3.listObjects(saved_params, function(error, data) {
				if (error) {
					console.log(error); // an error occurred

				} else {
					for (var i = 0; i < data.Contents.length; i++) {
						var key = data.Contents[i].Key.split('/')[1].split('.txt')[0];
						self.addFileToSelect(key, data.Contents[i].Key);
					}
				}
			});



			bucket = new AWS.S3({
				params: {
					Bucket: 'kimpara'
				}
			});
			this.addUntitled();
		},

		triggerSampleDialog: function() {
			clearTimeout(sampleTimer);
			clearTimeout(delayTimer);
			$('#sample_button').removeClass('animation');
			ui_form.dialog("open");
			self.model.trigger('pauseKeyListeners');
		},

		startDelay: function() {
			$('#sample_button').addClass('animation');
			delayTimer = setTimeout(self.triggerSampleDialog, DELAY_INTERVAL);
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
				var sample_responses = {};
				sample_responses.work = working.val();
				sample_responses.difficult = difficult.val();


				ui_form.dialog("close");
				self.model.trigger('unpauseKeyListeners');
				clearTimeout(delayTimer);
				sampleTimer = setTimeout(this.startDelay, SAMPLE_INTERVAL);
				analytics.log('experience_sample', {
					type: 'experience_sample',
					id: 'experience_sample' + time.getTime(),
					action: 'auto_sample_response',
					data: exp_data
				});

				var sample_file = {
					Key: 'stored_data/sample_' + time.getTime() + '.txt',
					Body: JSON.stringify(sample_responses)
				};
				var drawing_file = {
					Key: 'stored_data/file_' + time.getTime() + '.txt',
					Body: JSON.stringify(exp_data.file)
				};
				bucket.upload(sample_file, function(err, data) {
					var results = err ? 'ERROR!' : 'SAVED.';
				});

				bucket.upload(drawing_file, function(err, data) {
					var results = err ? 'ERROR!' : 'SAVED.';
				});

			}

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

		addFileToSelect: function(filename, etag) {
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
					value: etag,
					text: filename
				}));
				return true;
			} else {
				return false;
			}

		},

		removeUntitled: function(){
			$("#fileselect option[value='untitled']").remove();
		},

		addUntitled: function(){
			this.removeUntitled();
			$("#fileselect").prepend("<option value='untitled'>untitiled</option>").val('untitled');
		},

		save: function(event, data) {
			this.removeUntitled();
			if (!currentName) {
				var name = this.promptName();
				if (!name) {
					return;
				} else {
					var added = this.addFileToSelect(name,'saved_files/'+name+'.txt');
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

			var drawing_file = {
				Key: 'saved_files/' + currentName + '.txt',
				Body: JSON.stringify(data),
				ACL: 'public-read-write'

			};
			bucket.upload(drawing_file, function(err, data) {
				var results = err ? 'ERROR!' : 'SAVED.';
			});
			this.disableSave();
			return true;

		},

		saveAs: function(event, data) {
			currentName = null;
			return this.save(null, data);

		},


		load: function(filename) {

			//this.save();
			//
			this.removeUntitled();
			var self = this;
			var params = {Bucket: 'kimpara', Key: filename};
			s3.getObject(params, function(error, data) {
				if (error) {
					console.log(error); // an error occurred

				} else {
					
					var data_obj = JSON.parse(data.Body.toString());

					self.loadJSON(data_obj);
					currentName = filename;
				}
			});



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
					this.addUntitled();
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