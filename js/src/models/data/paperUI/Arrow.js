define([
  'underscore',
  'paper',
  'backbone',
  'models/data/PaperUI',
  'utils/PPoint',
  'utils/PFloat',
  'utils/PColor'
], function(_, paper, Backbone, PaperUI, PPoint, PFloat, PColor) {

  var Arrow = PaperUI.extend({

    initialize: function(data) {
      if ( !data['constraint'] ) {
        console.log('[ERROR] Constraint arrow created without constraint.');
      } 
      PaperUI.prototype.initialize.apply(this, arguments);
      this.listenTo( this.get('constraint'), 'change:references', this.constraintInstancesChange );
      this.listenTo( this.get('constraint'), 'change:relatives', this.constraintInstancesChange );  
    },

    draw: function() {
      var constraint = this.get('constraint');
      if ( !constraint.get('references') && !constraint.get('relatives') ) { return; }

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
      arrowPath.fillColor = '#A5FF00';
      
      arrowPath.data.instance = this;
      this.set('geom', arrowPath);
      /*
      this.normalize();
      this.render();*/
      this.drawn = true;
    },

    constraintInstancesChange: function() {
      var constraint = this.get('constraint');
      var references = constraint.get('references');
      var relatives = constraint.get('relatives');

      if ( !references && relatives && !this.drawn) {
        this.set('tail', relatives.get('geom').bounds.center);
        this.set('head', relatives.get('geom').bounds.center);
        this.draw();
      }
      else if ( references && relatives ) {
        this.set('tail', relatives.get('geom').bounds.center);
        this.redrawTail();
        this.set('head', references.get('geom').bounds.center);
        this.redrawHead();
      }
      else if ( !references && !relatives && this.drawn ) {
        this.get('geom').remove();
        this.set('geom', null);
        this.drawn = false;
      }
      else {
        console.log('[ERROR] Constraint arrow cannot have reference be null');
      }
    },

    redrawTail: function() {
      var paper_geom = this.get('geom');
      var head = this.get('head');
      var tail = this.get('tail');
      var vector = head.subtract(tail).normalize(10);

      paper_geom.children[0].removeSegment(0);
      paper_geom.children[0].insert(0, tail);
      paper_geom.children[1].remove();
      var arrowHead = new paper.Path([
        head.add(vector.rotate(135)),
        head,
        head.add(vector.rotate(-135))
      ]);
      arrowHead.strokeColor = '#A5FF00'; // TODO: switch to get color
      paper_geom.addChild(arrowHead);

      this.set('geom', paper_geom);
      //this.normalize();
      //this.render();
    },

    redrawHead: function() {
      var paper_geom = this.get('geom');
      var head = this.get('head');
      var tail = this.get('tail');
      var vector = head.subtract(tail).normalize(10);

      paper_geom.children[0].removeSegment(1);
      paper_geom.children[0].add(head);
      paper_geom.children[1].remove();
      var arrowHead = new paper.Path([
        head.add(vector.rotate(135)),
        head,
        head.add(vector.rotate(-135))
      ]);
      arrowHead.strokeColor = '#A5FF00'; // TODO: switch to get color
      paper_geom.addChild(arrowHead);
      
      this.set('geom', paper_geom);
      //this.normalize();
      //this.render();
    },

    normalize: function() {
      var data = {};
      var geom = this.get('geom');
      var matrix = new paper.Matrix();
      matrix.translate( geom.bounds.center.x, geom.bounds.center.y );
      data.rotation_delta = new PFloat( matrix.rotation );
      data.scaling_delta = new PPoint( matrix.scaling.x, matrix.scaling.y );
      
      data.translation_delta = new PPoint( matrix.translation.x, matrix.translation.y, 'add');
      data.position = new PPoint(0, 0, 'set');
      
      data.rotation_origin = new PPoint(0, 0, 'set');
      data.scaling_origin = new PPoint(0, 0, 'set');
      data.fill_color = new PColor(geom.fillColor.red, geom.fillColor.green, geom.fillColor.blue, geom.fillColor.alpha);
      data.stroke_color = new PColor(geom.strokeColor.red, geom.strokeColor.green, geom.strokeColor.blue, geom.strokeColor.alpha);
      data.stroke_width = new PFloat(geom.strokeWidth);
      var imatrix = matrix.inverted();
      geom.transform( imatrix );

      data.width = new PFloat( geom.bounds.width );
      data.height = new PFloat( geom.bounds.height );

      geom.selected = false;
      geom.data.nodetype = this.get('name');
      /* Add for points
       * if ( geom.segments ) {
       *   var segments = geom.segments;
       *   for ( var i = 0; i < segments.length; i++ ) {
       *     var pointNode = new PointNode();
       *     pointNode.normalizeGeometry( segments[i] );
       *     this.addChildNode( pointNode );
       *   }
       * }
       */
       this.set(data);
    },

    onMouseEnter: function( event ) {
      // double stroke weight
      if ( !this.get('active') ) {
        var stroke_width_prop = this.accessProperty('stroke_width');
        stroke_width_prop.setValue( 1.6 * stroke_width_prop.getValue() );
      }
    },

    onMouseLeave: function( event ) {
      if ( !this.get('active') ) {
        var stroke_width_prop = this.accessProperty('stroke_width');
        stroke_width_prop.setValue( stroke_width_prop.getValue() / 1.6 );
      }
    },

    onClick: function( event ) {
      // turn active, so mouse enter and leave events stop firing
      this.set('active', true);
      // show associated delimiters
    }

  });

  return Arrow;

});
