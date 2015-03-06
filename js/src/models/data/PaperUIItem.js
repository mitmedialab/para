/* PaperUIItem.js
 *
 * NOTE: Doesn't handle path alterations
 *
 */

define([
  'underscore',
  'paper',
  'models/data/PaperUI',
  'utils/PPoint',
  'utils/PFloat'

], function(_, paper, PaperUI, PPoint, PFloat) {

  var PaperUIItem = PaperUI.extend({
    
    defaults: _.extend({}, PaperUI.prototype.defaults, {
      name: 'ui-item',
    }),

    // TODO: perhaps allow this to take path data and normalize it?
    initialize: function(data) {
      PaperUI.prototype.initialize.apply(this, arguments);
    },
  
    normalizeGeometry: function(path, matrix) {
      var data = {};
      data.rotation_delta = new PFloat(matrix.rotation);
      // TODO: make some normalizations util function
      if (data.rotation_delta > 360 || data.rotation_delta < 0) {
        data.rotation_delta = TrigFunc.wrap(data.rotation_delta, 0, 360);
      }
      data.scaling_delta = new PPoint(matrix.scaling.x, matrix.scaling.y);

      var translation_delta = new PPoint(matrix.translation.x, matrix.translation.y, 'add');
      var position = new PPoint(0, 0, 'set');

      data.translation_delta = translation_delta;
      data.position = position;

      data.rotation_origin = new PPoint(0, 0, 'set');
      data.scaling_origin = new PPoint(0, 0, 'set');

      var imatrix = matrix.inverted();
      path.transform(imatrix);
      
      data.width = new PFloat(path.bounds.width);
      data.height = new PFloat(path.bounds.height);
      
      var pathJSON = path.exportJSON({
        asString: true
      });
      this.set('master_path', new PFloat(pathJSON));
     
      path.remove(); 
      for (var property in data) {
        if (data.hasOwnProperty(property)) {
          
          data[property].setNull(false);
        }
      }
      this.set(data);
      var path_altered = this.get('path_altered');
      path_altered.setNull(false);
      this.setPathAltered();

      return data;
    },

    renderGeom: function() {
      var geom = this.get('geom');
      var rmatrix = this.get('rmatrix');
      var smatrix = this.get('smatrix');
      var tmatrix = this.get('tmatrix');

      if (geom) { return; }
      geom = paper.project.activeLayer.importJSON(this.accessProperty('master_path'));
      geom.data.instance = this;
      var position = this.get('position').toPaperPoint();
      geom.position = position;
      geom.transform(smatrix);
      geom.transform(rmatrix);
      geom.transform(tmatrix);
      var screen_bounds = geom.bounds;
      //screen_bounds.selected = selected;
      this.set({
        screen_top_left: screen_bounds.topLeft,
        screen_top_right: screen_bounds.topRight,
        screen_bottom_right: screen_bounds.bottomRight,
        screen_bottom_left: screen_bounds.bottomLeft,
        center: screen_bounds.center,
        left_center: screen_bounds.leftCenter,
        right_center: screen_bounds.rightCenter,
        bottom_center: screen_bounds.bottomCenter,
        top_center: screen_bounds.topCenter,
        area: screen_bounds.area,
        screen_width: screen_bounds.width,
        screen_height: screen_bounds.height,
      });
      this.set('geom', geom);   
    },

    normalizeGeometryo: function(path, matrix) {
      var data = {};
      data.rotation_delta = new PFloat(matrix.rotation);
      // TODO: make some normalizations util function
      if (data.rotation_delta > 360 || data.rotation_delta < 0) {
        data.rotation_delta = TrigFunc.wrap(data.rotation_delta, 0, 360);
      }
      data.scaling_delta = new PPoint(matrix.scaling.x, matrix.scaling.y);
      
      var translation_delta = new PPoint(matrix.translation.x, matrix.translation.y, 'add');
      var position = new PPoint(0,0 ,'set');

      data.translation_delta=translation_delta;
      data.position = position;

      data.rotation_origin = new PPoint(0, 0, 'set');
      data.scaling_origin = new PPoint(0, 0, 'set');

      var imatrix = matrix.inverted();
      path.transform(imatrix);

      data.width = new PFloat(path.bounds.width);
      data.height = new PFloat(path.bounds.height);

      path.visible = false;
      path.selected = false;
      path.data.nodetype = this.get('name');

      var pathJSON = path.exportJSON({
        asString: true
      });
      //console.log('pathJSON', pathJSON);
      //var geom = paper.project.importJSON(pathJSON);
      //console.log('importJSON', geom);
      this.set('master_path', new PFloat(pathJSON));
    
      path.remove(); // WARNING: Memory leak??
      for (var property in data) {
        if (data.hasOwnProperty(property)) {
          
          data[property].setNull(false);
        }
      }
      this.set(data);
      var path_altered = this.get('path_altered');
      path_altered.setNull(false);
      this.setPathAltered();

      return data;
    },

    render: function() {
      if (!this.get('rendered')) {
        var geom = this.renderGeom();
        this.set('rendered', true);
        return geom;
      }
    },

    renderGeomo: function() {
      var geom = this.get('geom');

      var path_altered = this.get('path_altered').getValue();
      if (!path_altered && geom) {
              geom.selected = false;
      } else {
              if (!geom) {
                geom = paper.project.activeLayer.importJSON(this.accessProperty('master_path'));
              }
      }
      geom.data.instance = this;

      var screen_bounds = geom.bounds;
      //screen_bounds.selected = selected;
      this.set({
              screen_top_left: screen_bounds.topLeft,
              screen_top_right: screen_bounds.topRight,
              screen_bottom_right: screen_bounds.bottomRight,
              screen_bottom_left: screen_bounds.bottomLeft,
              center: screen_bounds.center,
              left_center: screen_bounds.leftCenter,
              right_center: screen_bounds.rightCenter,
              bottom_center: screen_bounds.bottomCenter,
              top_center: screen_bounds.topCenter,
              area: screen_bounds.area,
              screen_width: screen_bounds.width,
              screen_height: screen_bounds.height,
      });

      this.set('geom', geom);
      var p_altered = this.get('path_altered');
      p_altered.setValue(false);
      this.set('path_altered', p_altered);

      return geom;

    }

  });

  return PaperUIItem;
});
