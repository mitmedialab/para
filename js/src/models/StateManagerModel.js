/*StateManagerModel.js
*model that manages all base shapes*/

define([
  'jquery',
  'underscore',
  'backbone',
   'models/data/PathNode'

], function($, _, Backbone,PathNode) {
  var currentPath;
  var StateManagerModel = Backbone.Model.extend({

  	 defaults: {
    'state':  'shapeDraw',
  	},

  	initialize: function(){
  //setup the root node
        /*var rootNode = new SceneNode({name:'root'});
         rootNode.addChildNode(pathNode1);
        rootNode.update();*/
  	},

//triggered by canvas view on a mouse down event
  	canvasMouseDown : function(x,y) {
  		  if (!currentPath) {
        		currentPath = new PathNode({name:'path1'});
			}
       	currentPath.addPoint(x,y);
       	this.trigger('change:update');
      
       }



  });

  return StateManagerModel;

});