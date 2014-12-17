/*CanvasView.js
 * controls updates to the canvas- where all the drawing should happen... */

define([
  'jquery',
  'underscore',
  'backbone',
  'paper',
  'utils/PPoint'

], function($, _, Backbone, paper, PPoint) {

  var prototypes, currentId;
  var tool;
  //booleans for keeping track of whether user is clicking on sub or main canvas
  var sub, main, inactive, active;
  var sb;
  var saveKey = 83;
  var loadKey = 76;
  var panKey = 32;
  var rootKey = 82;
  var clutchKey = 72;
  var groupKey = 71;
  var altKey = false;
  var clearKey = 67;
  var pan = false;
  var last = {
    x: 0,
    y: 0
  };
  var CanvasView = Backbone.View.extend({
    //

    defaults: {

    },

    initialize: function(obj, event_bus) {
      $(".sub-canvas-container").resizable();
      prototypes = [];
      currentId = -1;
      sub = {
        down: false,
        inside: false
      };
      main = {
        down: false,
        inside: false
      };
      inactive = sub;
      active = main;


      this.event_bus = event_bus;

      //TODO: this is a hacky way to to detect key events
      _.bindAll(this, "canvasKeydown");
      _.bindAll(this, "canvasKeyup");

      $(document).bind('keydown', this.canvasKeydown);
      $(document).bind('keyup', this.canvasKeyup);
      $(window).bind('focus', this.setFocus);
      $(window).on("resize", this.resizeCanvas);

      $("#sub-canvas").bind('mousedown', this.subCanvasMouseDown);
      $("#sub-canvas").bind('mouseup', {
        parent: this
      }, this.subCanvasMouseUp);

      $("#sub-canvas").bind('mouseenter', this.enterSub);
      $("#sub-canvas").bind('mouseleave', this.leaveSub);
      $("#sub-canvas").bind('dblclick', {
        parent: this
      }, this.subDblclick);

      //bind paper tool events
      tool = new paper.Tool();
      tool.activate();
      tool.parent = this;
      tool.attach('mousedown', this.toolMouseDown);
      tool.attach('mousedrag', this.toolMouseDrag);
      tool.attach('mouseup', this.toolMouseUp);

      this.listenTo(this.model, 'centerGeom', this.centerGeom);


    },

    //canvas events
    events: {
      'mousedown': 'canvasMouseDown',
      'mouseup': 'canvasMouseUp',
      'mousemove': 'canvasMouseMove',
      'mouseenter': 'enterMain',
      'mouseleave': 'leaveMain',
      'mousewheel': 'canvasMousewheel',
      'dblclick': 'canvasDblclick'
    },

    setFocus: function() {
      pan = false;
      altKey = false;
    },

    /* sets main canvas as active 
     * by setting inactive to subDown
     */
    setMainActive: function() {
      inactive = sub;
      active = main;
    },

    /* sets sub canvas as active 
     * by setting inactive to mainDown
     */
    setSubActive: function() {
      inactive = main;
      active = sub;

    },


    resizeCanvas: function() {
      var c = $('#canvas');
      c.attr('width', $(window).attr('innerWidth'));
      c.attr('height', $(window).attr('innerHeight'));

      paper.view.draw();

    },

    /* tool mouse event functions */

    toolMouseDown: function(event) {
      if (!inactive.inside) {
        this.parent.model.toolMouseDown(event, pan);
      }
    },

    toolMouseUp: function(event) {
      this.parent.model.toolMouseUp(event, pan);
    },

    toolMouseDrag: function(event) {
      if (!inactive.down) {

        this.parent.model.toolMouseDrag(event, pan);
      }
    },


    toolMouseMove: function(event) {
      this.parent.model.toolMouseMove(event);
    },


    /* canvas event functions */
    canvasKeydown: function(event) {
      if (event.keyCode == saveKey) {
        this.model.save();
      }
      if (event.keyCode === clearKey) {
        this.model.deleteObject();
      }
      if (event.keyCode === panKey) {
        pan = true;
      }
      if (event.altKey) {
        altKey = true;
      }
      if (event.keyCode === rootKey) {
        this.model.moveToRoot();
      }
      if (event.keyCode === groupKey) {
        this.model.group();
      }
      if (event.keyCode === clutchKey) {
        this.model.toggleClutch();
      }

    },

    canvasKeyup: function(event) {
      pan = false;
      altKey = false;
    },

    //enter and leave functions manage keyboard events by focusing the canvas elemennt
    enterMain: function() {
      this.$el.addClass('hover');
      var span = this.$el.find('span');
      span.attr('tabindex', '1').attr('contenteditable', 'true');
      span.focus();
      main.inside = true;
    },

    leaveMain: function() {
      this.$el.removeClass('hover');
      var span = this.$el.find('span');
      span.removeAttr('contenteditable').removeAttr('tabindex');
      span.blur();
      main.inside = false;
    },

    enterSub: function() {
      sub.inside = true;
    },

    leaveSub: function() {
      sub.inside = false;
    },

    canvasMouseDown: function(event) {

      main.down = true;
    },

    canvasMouseUp: function(event) {
      if (sub.down) {
        this.instantiatePrototype(event);
      }
      main.down = false;
      sub.down = false;
    },

    subCanvasMouseDown: function(event) {
      sub.down = true;
    },

    subCanvasMouseUp: function(event) {
      if (main.down) {
        var data = event.data.parent.model.addPrototype();
        if(data){
          var targetPosition = data.geom.position;
          event.data.parent.centerGeom(targetPosition);
        }
      }
      sub.down = false;
      main.down = false;
    },


    canvasMouseMove: function(event) {
      this.event_bus.trigger('canvasMouseMove', event);

      if (active) {
        var delta = {
          x: event.offsetX - last.x,
          y: event.offsetY - last.y
        };
        this.model.canvasMouseDrag(delta, pan);
      }

      last.x = event.offsetX;
      last.y = event.offsetY;

    },

    canvasMousewheel: function(event) {
      this.model.canvasMouseWheel(event, pan, altKey);

    },

    canvasDblclick: function(event) {
      this.setMainActive();

      this.model.toggleView(true);
      $('#sub-canvas').css('background-color', '#232323');
      $('#canvas').css('background-color', '#5B5B5B');
    },

    subDblclick: function(event) {
      event.data.parent.setSubActive();
      event.data.parent.model.toggleView(false);
      $('#sub-canvas').css('background-color', '#5B5B5B');
      $('#canvas').css('background-color', '#232323');


    },

    /*centers the sub-view on a specific point */
    centerGeom: function(targetPoint) {
      var view = paper.View._viewsById['sub-canvas'];
      var subCanvas = $('#sub-canvas');
      var subCanvasCon = $('.sub-canvas-container');
      var c_dim = new PPoint(subCanvas.width(), subCanvas.height());
      var con_dim = new PPoint(subCanvasCon.width(), subCanvasCon.height());
      var con_center = con_dim.div(2, true);
      var c_center = c_dim.div(2, true);
      var diffCenter = c_center.sub(con_center, true);
      var diffTarget = new PPoint(targetPoint.x, targetPoint.y).sub(c_center, true);
      view.center = c_center.toPaperPoint();
      view.zoom=1;
      view.scrollBy(diffCenter.add(diffTarget, true));
      view.draw();
    },

    /*attempts to create a new instance of the current prototype*/
    instantiatePrototype: function(event) {
      var instantiated = this.model.geometryInstantiated(event.offsetX, event.offsetY);
    }



  });

  return CanvasView;

});