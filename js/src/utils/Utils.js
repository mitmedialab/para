/* Utils.js
 * 
 * Static namespace with a bunch of convenience functions.
 *
 */

define([
  'jquery',
  'underscore',
  'utils/PPoint'
], function($, _, PPoint) {
  
  var Utils = {

    getPropFromList: function( instanceList, propertySplit ) {
      return instanceList.map( function( instance ) {
        var property = instance.accessProperty( propertySplit[0] );
        for ( var i = 1; i < propertySplit.length - 1; i++ ) {
          property = property[propertySplit[i]];
        }
        property = property[propertySplit[propertySplit.length - 1]];
        return property; 
      });
    },

    getPropConstraintFromList: function( instanceList, propertySplit ) {
      return instanceList.map( function( instance ) {
        var property = instance.inheritProperty( propertySplit[0] );
        for ( var i = 1; i < propertySplit.length; i++ ) {
          property = property[propertySplit[i]];
        }
        return property;
      });
    },

    getCentroid: function( pointList ) {
      // should check for instances of PPoint
      var sum_point = pointList.reduce( function( point1, point2 ) { 
        return new PPoint( point1.x + point2.x, point1.y + point2.y, 'set' ) 
      });
      var centroid = new PPoint( sum_point.x / pointList.length, sum_point.y / pointList.length, 'set' );
      return centroid;
    },

    getCentroid: function( xList, yList ) {
      var pointList = xList.map( function( xval, index ) { return new PPoint( xval, yList[index] ) });
      return this.getCentroid( pointList );
    },

    zip: function( arrays ) {
      return arrays[0].map( function(_, i) {
        return arrays.map( function( array ) { return array[i] } )
      });
    },

    max: function( list ) {
      return Math.max( list );
    },

    min: function( list ) {
      return Math.min( list );
    },

    avg: function( list ) {
      var sum = list.reduce( function(a, b) { return a + b });
      var res = sum / list.length;
      return res;
    },

    propSpecifierToReference: function( instanceList, propSpecifier ) {
      
    }
  };
  
  return Utils;
});
