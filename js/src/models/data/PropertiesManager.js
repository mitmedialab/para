/*PropertiesManager.js
 *manages properties of shape*/

define(['jquery',
  'underscore',
  'backbone',
  'filesaver',
  'utils/ColorUtils',

], function($, _, Backbone, FileSaver,ColorUtils) {


  var uninstantiated;

  var PropertiesManager = Backbone.Model.extend({

    defaults: {

    },

    initialize: function(attributes, options) {
      localStorage.clear();
      this.modified = false;
    
    },


    geometrySelected: function(instance) {
      var styledata = {};
      var literal = instance.get('geom');
      if (literal) {
        styledata = {
          fillColor: (literal.fillColor) ? literal.fillColor.toCSS(true) : null,
          strokeColor: (literal.strokeColor) ? literal.strokeColor.toCSS(true) : null,
          strokeWidth: (literal.strokeWidth) ? literal.strokeWidth : null
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

      if (data.strokeColor) {
        style.strokeColor = data.strokeColor;
      }
      if (data.fillColor) {
        style.fillColor = data.fillColor;
      }
      if (data.strokeWidth) {
        style.strokeWidth = data.strokeWidth.val;
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


   


  });

  return PropertiesManager;

});