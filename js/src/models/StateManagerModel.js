/*StateManagerModel.js
 *model that manages all base shapes*/

define(['jquery',
  'underscore',
  'paper',
  'backbone',
  'backbone.undo',
  'filesaver',
  'utils/PPoint',
  'utils/ColorUtils',

  'utils/PaperUIHelper',

], function($, _, paper, Backbone, UndoManager, FileSaver,PPoint, ColorUtils,PaperUIHelper, FunctionManager) {


  var uninstantiated;
  var undoLimit = 15;

  var StateManagerModel = Backbone.Model.extend({

    defaults: {

    },

    initialize: function(attributes, options) {
      //setup paperscopes
      var canvas = $('canvas').get(0);
      paper.setup(canvas);
     

      // setup helpers and factories
      PaperUIHelper.setup(this);




      // this.listenTo(toolCollection, 'updateProperties', this.updateProperties);

      //clear local storage
      localStorage.clear();
      this.modified = false;

      //setup undo manager
      Backbone.UndoManager.removeUndoType("change");
      var beforeCache;
      Backbone.UndoManager.addUndoType("change:isChanging", {
        "on": function(model, isChanging, options) {
          if (isChanging) {
            beforeCache = model.exportJSON();
          } else {
            return {
              "object": model,
              "before": beforeCache,
              "after": model.exportJSON()
            };
          }
        },
        "undo": function(model, before, after, options) {
          model.undoRedo(before);
        },
        "redo": function(model, before, after, options) {
          model.undoRedo(after);
        }
      });


      //setup default zeros for zoom and pan
      this.zeroedZoom = paper.view.zoom;
      this.zeroedPan = paper.view.center.clone();
    },

    /*animate: function() {
      var selectedShapes = selectTool.get('selected_shapes');
      var property;
      var levels = 1;
      switch (selectTool.get('mode')) {
        case 'select':
          property = 'translation_delta';
          break;
        case 'rotate':
          property = 'rotation_delta';
          break;
        case 'scale':
          property = 'scaling_delta';
          break;
      }
      for (var i = 0; i < selectedShapes.length; i++) {
        selectedShapes[i].animateAlpha(levels, property, this.get('tool-mode'), this.get('tool-modifier'), 0);


      }
      paper.view.draw();

    },*/



    geometrySelected: function(instance) {
      var styledata = {};
      var literal = instance.get('geom');
      if (literal) {
        styledata = {
          fill_color: (literal.fillColor) ? literal.fillColor.toCSS(true) : null,
          stroke_color: (literal.strokeColor) ? literal.strokeColor.toCSS(true) : null,
          stroke_width: (literal.strokeWidth) ? literal.strokeWidth : null
        };
        this.setToolStyle(styledata);
      }
    },

    geometryParamsModified: function(data) {
     //toolCollection.geometryParamsModified(data);
    },

  
    /*setToolStyle
     * called to update the style settings for the currently selected tool
     */
    setToolStyle: function(data) {
      //var selectedTool = toolCollection.get(this.get('state'));
    /*  var style = selectedTool.get('style');

      if (data.stroke_color) {
        style.stroke_color = data.stroke_color;
      }
      if (data.fill_color) {
        style.fill_color = data.fill_color;
      }
      if (data.stroke_width) {
        style.stroke_width = data.stroke_width.val;
      }
      selectedTool.set('style', style);*/
    },


    /*styleModified
     * triggered when style properties are modified in the property bar
     * updates the color/ fill/ stroke weight of selected shapes
     */
    styleModified: function(style_data) {
     // toolCollection.modifyStyle(style_data);

    },


    canvasMouseDrag: function(delta, pan) {
      if (pan) {
        var inverseDelta = new paper.Point(-delta.x / paper.view.zoom, -delta.y / paper.view.zoom);
        paper.view.scrollBy(inverseDelta);

        event.preventDefault();
      }
    },

    changeZoom: function(oldZoom, delta, c, p) {
      var newZoom = this.calcZoom(oldZoom, delta);
      var beta = oldZoom / newZoom;
      var pc = p.subtract(c);
      var a = p.subtract(pc.multiply(beta)).subtract(c);
      return {
        z: newZoom,
        o: a
      };
    },

    calcZoom: function(oldZoom, delta) {
      var factor = 1.05;
      if (delta < 0) {
        return oldZoom * factor;
      }
      if (delta > 0) {
        return oldZoom / factor;
      }
    },



    canvasMouseWheel: function(event, pan, modify) {
      var delta = event.originalEvent.wheelDelta; //paper.view.center

      if (pan) {

        var mousePos = new paper.Point(event.offsetX, event.offsetY);
        var viewPosition = paper.view.viewToProject(mousePos);
        var data = this.changeZoom(paper.view.zoom, delta, paper.view.center, viewPosition);
        paper.view.zoom = data.z;
        paper.view.center = paper.view.center.add(data.o);
        event.preventDefault();
        paper.view.draw();
      } 
    },

    canvasDblclick: function(event) {
    },



    /* saveFile: function(id, filename) {
       if (this.modified) {
         id = this.save(filename);
       }
       var data = localStorage[id];
       var blob = new Blob([data], {
         type: 'text/plain;charset=utf-8'
       });
       var fileSaver = new FileSaver(blob, filename);
       return id;
     },

     save: function() {

       var id = Date.now();
       var data = {}; //JSON.stringify(rootNode.exportJSON());

       this.saveToLocal(id, data);

       this.trigger('localSaveComplete', id);
       this.modified = false;
       this.trigger('disableSave', !this.modified);
       return id;
     },

     saveToLocal: function(id, data) {
       var saved = false;
       while (localStorage.length > undoLimit - 1) {
         // try {

         //} catch (e) {
         var arr = [];
         for (var key in localStorage) {
           if (localStorage.hasOwnProperty(key) && !isNaN(key)) {
             arr.push(key);
           }
         }

         arr.sort(function(a, b) {
           return a.toLowerCase().localeCompare(b.toLowerCase());
         });

         this.trigger('removeItem', arr[0]);
         localStorage.removeItem(arr[0]);

         //}
       }
       localStorage.setItem(id, data);
       saved = true;
     },


     loadLocal: function(filename) {

       var data = localStorage[filename];
       this.load(JSON.parse(data));
     },

   

     loadFile: function(file) {
       var reader = new FileReader();
       reader.parent = this;
       reader.onload = (function(theFile) {

         return function(e) {
           this.parent.load(JSON.parse(e.target.result));
           var id = this.parent.save(theFile.name);
           this.parent.trigger('loadComplete', id, theFile.name);
           paper.view.zoom = this.parent.zeroedZoom;
           paper.view.center = this.parent.zeroedPan.clone();
         };
       })(file);
       reader.readAsText(file);
     },

     parseJSON: function(currentNode, data) {
       for (var i = 0; i < data.length; i++) {
         var type = data[i].type;
         var node;
         switch (type) {
           case 'path':
             node = new PathNode(data[i]);
             break;
           case 'polygon':
             node = new PolygonNode(data[i]);
             break;
           default:
             node = new GeometryNode(data[i]);
             break;
         }
         node.type = type;
         node.name = data[i].name;
         currentNode.addChildNode(node);


         if (data[i].children.length > 0) {
           this.parseJSON(node, data[i].children);
         }

       }

     }*/

  });

  return StateManagerModel;

});