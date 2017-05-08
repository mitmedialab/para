/* SceneNode.js 
 * base class for node in scene graph
 *
 */

define([
    'underscore',
    'backbone',
    'models/data/properties/PConstraint',



], function(_, Backbone, PConstraint) {


    var SceneNode = PConstraint.extend({
        defaults: _.extend({}, PConstraint.prototype.defaults, {
            visited: false,
            rendered: false,
            edges: null,
        }),


        initialize: function() {
            this.set({
                edges: []
            });
            //parent node
            this.nodeParent = null;
            //array to store children
            this.children = [];
            //array to store edges (for graph)

            //Global property that keeps track of total # of nodes
            SceneNode.numNodeInstances++;
        },

        /* extend
         * function for adding in functionality via mixins
         */
        extend: function(source) {
            for (var k in source) {
                if (source.hasOwnProperty(k) && !this.hasOwnProperty(k)) {
                    this[k] = source[k];
                }
            }
            return this;
        },


        /* clone: function(){
              var clone= Backbone.Model.prototype.clone.apply(this,arguments);
             var children = [];
             var edges = [];
             for(var i=0;i<this.children.length;i++){
                     var cchild = this.children[i].clone();
                     children.push(cchild);
             }
             var cedges = this.get('edges');
              for(var j=0;j<cedges.length;j++){
                     var edge = cedges[j].clone();
                     edge.set('y',this);
             }
             clone.children = children;
             clone.set('edges',edges);
             clone.nodeParent = this.nodeParent;
             return clone; 

         },*/
        /*visit
         * placeholder visit function for
         * external vistior tree traversal
         */
        visit: function(visitor, visitFunction, departureNode, state_data) {
            return visitor[visitFunction](this, departureNode, state_data);
        },


        /*getEdge
         * searches edge array for matching x value
         * and returns relevant edge
         */
        getEdge: function(x) {
            var edges = this.get('edges');

            for (var i = 0; i < edges.length; i++) {
                if (edges[i].get('x') === x) {
                    return edges[i];
                }
            }
            return null;
        },

        /*edgesRendered
         * checks to see if all x values of edges connected to this node
         * have been rendered
         */
        edgesRendered: function() {
            var edges = this.get('edges');
            for (var i = 0; i < edges.length; i++) {
                if (!edges[i].get('x').get('rendered')) {
                    return false;
                }
            }
            return true;
        },

        /*addEdge
         * checks to see if edge with x already exists
         * in edge list. If not, adds a new edge
         * otherwise, throws an error.
         * TODO: merge/ overwrite conflicting edges
         */
        addEdge: function(edge, x) {
            var edges = this.get('edges');
            if (!this.getEdge(x)) {
                edges.push(edge);
                this.set('edges', edges);
            } else {
                console.error("adding overriding edge");
            }

        },

        // leave this empty function here temporarily so errors don't get thrown
        reset: function () {
          // 
        },


        /*================ SceneNode method defintions ================*/

        //destructor: clears all this.children and sets parent to null
        clear: function() {

            this.nodeParent = null;
            for (var i = 0; i < this.children.length; i++) {
                this.children[i].clear();
                this.children[i] = null;
            }

            //this.children.clear();
            return true;


        },

        //returns parent node
        getParentNode: function() {

            if (this.nodeParent !== null) {
                return this.nodeParent;
            } else {
                return null;
            }
        },

        //returns this.children array
        getChildren: function() {
            return this.children;
        },
        //returns other nodes with the same parent
        getSiblings: function() {
            var siblings = this.nodeParent.getChildren().slice();
            var index = siblings.indexOf(this);
            var cut = siblings.splice(index, 1)[0];

            if (cut == this) {
                return siblings;
            }

        },

        isSibling: function(sibling) {
            return _.contains(sibling.getParentNode().children, this);
        },

        setChildBefore: function(child, sibling) {
            console.log('set child before',child.isSibling(sibling));
            if (child.isSibling(sibling)) {

                var childIndex = child.getChildIndex();
                this.children.splice(childIndex, 1);
                var siblingIndex = sibling.getChildIndex();
                this.children.splice(siblingIndex, 0, child);
                console.log('startIndex',childIndex,'endIndex',child.getChildIndex());
            }
        },

        setChildAfter: function(child, sibling) {
            if (child.isSibling(sibling)) {
                var childIndex = child.getChildIndex();
                this.children.splice(childIndex, 1);
                var siblingIndex = sibling.getChildIndex();
                this.children.splice(siblingIndex + 1, 0, child);

            }
        },

        insertChild: function(index,child){
            if(child.nodeParent!=this){
                if(child.nodeParent){
                child.nodeParent.removeChildNode(child);
                }
                child.setParentNode(this);
            }
            
            this.children.splice(index,0,child);
             for(var i=0;i<this.children.length;i++){
                this.children[i].index = i;
             }
        },

        getChildIndex: function() {
          return _.indexOf(this.getParentNode().children,this);
        },

        descendantOf: function(node) {
            for (var i = 0; i < this.children.length; i++) {
                if (this.children[i] == node || this.children[i].descendantOf(node)) {
                    return true;
                }
            }

            return false;


        },

        /*returns heierarchal level in tree*/
        getLevelInTree: function(level) {
            if (this.get('name') == 'root') {
                return level;
            } else {
                level++;

                return this.nodeParent.getLevelInTree(level);
            }

        },

        //returns child at specified index 
        getChildAt: function(index) {

            if (this.children.length > index) {
                return this.children[index];
            }
            return null;
        },

        //returns number of this.children        
        getNumChildren: function() {
            return this.children.length;
        },

        //sets parent node. 
        //If node already has a parent, it removes itself from the parent's this.children
        setParentNode: function(node) {
            if (node !== null) {
                if (this.nodeParent !== null) {
                    this.nodeParent.removeChildNode(this);
                }
                this.nodeParent = node;
                return true;
            }
            return false;
        },

        removeParentNode: function() {


            if (this.nodeParent !== null) {
                this.nodeParent = null;
                return true;

            }
            return false;
        },
        //adds new child and sets child parent to this
        addChildNode: function(node) {
            if(node.nodeParent){
                node.nodeParent.removeChildNode(node);
            }
            if (node !== null) {
                node.setParentNode(this);
                this.children.push(node);
                node.index = this.children.length - 1;

                return true;
            }

            return false;

        },
        //removes child node from list of this.children- does not delete the removed child!
        removeChildNode: function(node) {
            if (node !== null && this.children.length > 0) {
                for (var i = 0; i < this.children.length; i++) {

                    if (this.children[i] == node) {
                        this.children[i].removeParentNode();
                        var child = this.children.splice(i, 1)[0];
                        return child;

                    }
                }
            }
            return false;
        },

        removeChildAt: function(i) {
            if (this.children[i] !== null) {
                this.children[i].removeParentNode();
                var child = this.children.splice(i, 1)[0];
                return child;

            }
        },

        //recursively searches all sub this.children for child to remove- depth first. Not very efficient. double check to see if this is actually working correctly...
        recursiveRemoveChildNode: function(node) {
            if (node !== null && this.children.length > 0) {
                for (var i = 0; i < this.children.length; i++) {
                    if (this.children[i] == node) {
                        this.children.splice(i, 1);
                        return true;
                    } else {

                        if (this.children[i].recursiveRemoveChildNode(node)) {
                            return true;
                        }
                    }
                }
            }
            return false;
        },



    });



    //static var for keeping track of total number of nodes across the graph
    SceneNode.numNodeInstances = 0;



    return SceneNode;

});