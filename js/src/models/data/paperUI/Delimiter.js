define([
  'underscore',
  'paper',
  'backbone',
  'models/data/PaperUI'
], function(_, paper, Backbone, PaperUI) {

  var Delimiter = PaperUI.extend({
    dashArray: [10, 12],
    defaultStroke: '#A5FF00',
    defaultWidth: 3,
    defaultFill: '#A5FF00',
    tentativeStroke: '#ff7777',
    tentativeFill: '#ff7777',
    activeStroke: '#ff0000',
    activeFill: '#ff0000',

    initialize: function(data) {
      PaperUI.prototype.initialize.apply(this, arguments);
      this.listenTo( this.get('constraint') , 'delimitersDrawn', this.addListeners );
    },

    // should be overridden by subclasses!
    addListeners: function() {
    
    },

    remove: function() {
      this.stopListening();
      this.get('geom').remove();
      this.set('geom', null);
    }
  });

  return Delimiter;

});
