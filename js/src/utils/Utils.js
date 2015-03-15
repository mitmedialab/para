/* Utils.js
 * 
 * Static namespace with a bunch of convenience functions. Typically
 * these are for accessing properties and modifying them from sets
 * of instances; it may be prudent to make different representations
 * to hold these functions, such as an 'Instance List'.
 *
 */

define([
  'jquery',
  'underscore',
  'utils/PPoint'
], function($, _, PPoint) {
  
  var Utils = {

    /*
     * Extracts the value of a property from each instance. The method
     * allows for not just the direct properties of the instance, such
     * as 'position' to be accessed, but indirect properties such as 
     * the x-coordinate of the position, with the full identifier of
     * the property to access being given as a 'Property List', a 
     * sequence of nested properties (e.g. ['position', 'x'] corresponds
     * to position.x)
     *
     * @param instanceList  - the list of instances to compute from
     * @param propertySplit - the list specifying the exact property 
     *
     */
    getPropFromList: function( instanceList, propertySplit ) {
      return instanceList.map( function( instance ) {
        var property = instance.accessProperty( propertySplit[0] );
        if ( propertySplit.length == 1 ) { return property; }
        for ( var i = 1; i < propertySplit.length - 1; i++ ) {
          property = property[propertySplit[i]];
        }
        property = property[propertySplit[propertySplit.length - 1]];
        return property; 
      });
    },

    /*
     * Extracts the constraint for a property from each instance. The method
     * allows for not just the direct properties of the instance, such
     * as 'position' to be accessed, but indirect properties such as 
     * the x-coordinate of the position, with the full identifier of
     * the property to access being given as a 'Property List', a 
     * sequence of nested properties (e.g. ['position', 'x'] corresponds
     * to position.x)
     *
     * @param instanceList  - the list of instances to compute from
     * @param propertySplit - the list specifying the exact property 
     *
     */
    getPropConstraintFromList: function( instanceList, propertySplit ) {
      return instanceList.map( function( instance ) {
        console.log('property constraint name', instance.get('name'));
        if(instance.get('name')==='path_sampler'){
          console.log('found path sampler');
          return instance;
        }
        var property = instance.inheritProperty( propertySplit[0] );
        if(!property       ){
          property = instance.activateProperty(propertySplit[0]);
        }
        for ( var i = 1; i < propertySplit.length; i++ ) {
          property = property[propertySplit[i]];
        }
        return property;
      });
    },

    /*
     * Computes the centroid for a list of points.
     *
     * @param pointList - a list of PPoints
     */
    getCentroid: function( pointList ) {
      // should check for instances of PPoint
      var sum_point = pointList.reduce( function( point1, point2 ) { 
        return new PPoint( point1.x + point2.x, point1.y + point2.y, 'set' );
      });
      var centroid = new PPoint( sum_point.x / pointList.length, sum_point.y / pointList.length, 'set' );
      return centroid;
    },

    /*
     * Computes the centroid for a list of points specified in paired 
     * x and y lists.
     *
     * @param xList - a list of x-coordinates for the points
     * @param yList - a list of y-coordinates paired to the x-coordinates
     */
    getCentroid: function( xList, yList ) {
      var pointList = xList.map( function( xval, index ) { return new PPoint( xval, yList[index] ); });
      return this.getCentroid( pointList );
    },

    /*
     * Returns the max of a list of numerics, alias for Math.max.
     *
     * @param list - a list of numerics
     */
    max: function( list ) {
      return Math.max( list );
    },

    /*
     * Returns the min of a list of numerics, alias for Math.max.
     *
     * @param list - a list of numerics
     */
    min: function( list ) {
      return Math.min( list );
    },

    /*
     * Returns the average of a list of numerics.
     *
     * @param list - a list of numerics
     */
    avg: function( list ) {
      var sum = list.reduce( function(a, b) { return a + b; });
      var res = sum / list.length;
      return res;
    },

    propSpecifierToReference: function( instanceList, propSpecifier ) {
      
    },

    // make sure we're not passing events for things like UI to canvas
    validateEvent: function( event ) {
      return (!event.item || event.item.name != 'ui');
    }
  };
  
  return Utils;
});
