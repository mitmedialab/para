define([
  'underscore',
  'paper',
  'backbone',
  'models/data/PaperUI',
], function(_, paper, Backbone, PaperUI) {

  var Arrow = PaperUI.extend({

    initialize: function(data) {
      PaperUI.prototype.initialize.apply(this, arguments);
    },

    draw: function() {
      var constraint = this.get('constraint');
      if ( !constraint.get('references') || !constraint.get('relatives') ) { 
        console.log('[ERROR] Cannot draw arrow without constraint references and relatives existing.');
        return; 
      }

      var references = constraint.get('references');
      var relatives = constraint.get('relatives');
      this.set('tail', relatives.get('geom').bounds.center);
      this.set('head', references.get('geom').bounds.center);

      var vector = this.get('head').subtract(this.get('tail')).normalize(10);
      var arrowPath = new paper.Group([
        new paper.Path([this.get('tail'), this.get('head')]),
        new paper.Path([
          this.get('head').add(vector.rotate(135)),
          this.get('head'),
          this.get('head').add(vector.rotate(-135))
        ])
      ]);
      arrowPath.strokeColor = '#A5FF00';
      arrowPath.fillColor = null; 
      
      this.set('geometry', arrowPath);
    },

    hide: function() {
      var geometry = this.get('geometry');
      geometry.remove();
      geometry = null;
    },

    show: function() {
      if ( this.get('geometry') ) {
        return;
      }
      this.draw();
    },

    redraw: function() {
      var geometry = this.get('geometry');
      if ( !geometry ) {
        console.log('[ERROR] Arrow is not drawn, so redraw() does nothing.');
        return;
      }
      geometry.remove();
      geometry = null;
      this.draw();
    },

    redrawTail: function(geom) {
      var arrow = this.get('geometry');
      var newTail = geom.position;
      var currentAngle = this.get('tail').subtract(this.get('head')).angle;
      var newAngle = geom.position.subtract(this.get('head')).angle;
      this.set('tail', newTail);
      arrow.rotate(newAngle - currentAngle, this.get('head'));
      arrow.children[0].removeSegment(0);
      arrow.children[0].insert(0, newTail);
    },

    //********* DEFAULT LISTENERS **********//
    onMouseEnter: function( event ) {
    
    },

    onMouseLeave: function( event ) {
    
    },

    onClick: function( event ) {
    
    },

    onMouseDown: function( event ) {

    },

    onMouseUp: function( event ) {

    }

  });

  return Arrow;

});
