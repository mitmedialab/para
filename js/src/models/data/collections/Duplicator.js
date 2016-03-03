/*Duplicator.js
 * list which can enact iterative constraints on its members and declaratively update number of copies of the target..
 */

define([
        'underscore',
        'models/data/Instance',
        'models/data/collections/ConstrainableList',
        'models/data/geometry/PathNode',
        'models/data/geometry/RectNode',
        'models/data/geometry/EllipseNode',
        'models/data/geometry/PolygonNode',
        'models/data/geometry/Group',
        'models/data/properties/PFloat',
        'models/data/properties/PBool',
        'paper',
        'models/data/properties/PConstraint',
        'models/data/Constraint',
        'utils/TrigFunc'

    ],

    function(_, Instance, ConstrainableList, PathNode, RectNode, EllipseNode, PolygonNode, Group, PFloat, PBool, paper, PConstraint, Constraint, TrigFunc) {
        var init_lookup = {
            'path': PathNode,
            'ellipse': EllipseNode,
            'polygon': PolygonNode,
            'rectangle': RectNode,
            'group': Group
        };
        var Duplicator = ConstrainableList.extend({

            defaults: _.extend({}, ConstrainableList.prototype.defaults, {
                name: 'duplicator',
                count: null,
                target: null,
                mode: 'standard',
                type: 'geometry',
                exception_count: null
            }),

            initialize: function() {
                ConstrainableList.prototype.initialize.apply(this, arguments);
                this.set('count', new PFloat(0));
                var geom = new paper.Group();
                this.set('geom', geom);
                geom.data.instance = this;

                //internal constraint lists storage
                this.group_relative = [];
                this.group_reference = [];
                this.internalList = new ConstrainableList();
                this.internalList.set('id', 'internal' + this.internalList.get('id'));

            },

            importSVG: function(data){
                var item = new paper.Group();
                item.importSVG(data);
            },

            exportSVG: function(){
                return this.get('geom').exportSVG({asString:true});
            },

            toJSON: function() {

                var data = ConstrainableList.prototype.toJSON.call(this, data);
                data.target_index = this.members.indexOf(this.get('target'));
                data.internalList = this.internalList.toJSON();
                data.group_relative = [];
                data.group_reference = [];
                for (var i = 0; i < this.group_relative.length; i++) {
                    data.group_relative.push(this.group_relative[i].toJSON());
                }
                for (var j = 0; j < this.group_reference.length; j++) {
                    data.group_reference.push(this.group_reference[j].toJSON());
                }

                return data;
            },


            parseJSON: function(data) {
                Instance.prototype.parseJSON.call(this, data);
                var target_index = data.target_index;
                var target_data = data.children[target_index];
                var target = this.getTargetClass(target_data.name);
                target.parseJSON(target_data,this);
                this.setTarget(target);
                var i, j, list;
                for (i = 0; i < data.children.length; i++) {
                    if (i != target_index) {
                        var name = data.children[i].name;
                        var child = this.getTargetClass(name);
                        child.parseJSON(data.children[i],this);
                        this.addMember(child, i);
                    }
                }

                target.parseInheritorJSON(target_data,this);

               
                this.internalList.parseJSON(data.internalList, this);
                for (i = 0; i < data.group_relative.length; i++) {
                    list = new ConstrainableList();
                    list.parseJSON(data.group_relative[i], this);
                    this.group_relative.push(list);
                }
                for (j = 0; j < data.group_reference.length; j++) {
                    list = new ConstrainableList();
                    list.parseJSON(data.group_reference[j], this);
                    this.group_reference.push(list);
                }
                 var memberCount = {
                    v: this.members.length,
                    operator: 'set'
                };
                for (j = 0; j < this.members.length; j++) {
                    this.members[j].get('zIndex').setValue(j);
                }
                this.get('memberCount').setValue(memberCount);
                this.toggleClosed(this);
               

            },

            getById: function(id) {
                for (var i = 0; i < this.members.length; i++) {
                    var match = this.members[i].getById(id);
                    if (match) {
                        return match;
                    }
                }
            },

            /*returns new child instance based on string name
             */
            getTargetClass: function(name) {
                var target_class = init_lookup[name];
                var child = new target_class();
                return child;
            },

            getInternalList: function(id) {
                if (this.internalList.get('id') === id) {
                    return this.internalList;
                }
                for(var i=0;i<this.group_relative.length;i++){
                    if(this.group_relative[i].get('id')===id){
                        return this.group_relative[i];
                    }
                    else if(this.group_reference[i].get('id')===id){
                        return this.group_reference[i];
                    }
                }
            },

            setInternalConstraint: function() {
                var constraints = [];
                if (this.get('target').get('name') == 'group') {
                    constraints.push.apply(constraints, this.setInternalGroupConstraint());
                }
                this.internalList.addMember(this.get('target'));
                console.log('internal ui',  this.internalList.get('ui'));
                 this.internalList.get('ui').remove();
                if (this.members.length > 1) {
                    this.internalList.addMember(this.members[this.members.length - 1]);
                }
                var constraint = new Constraint();
                constraint.set('references', this.internalList);
                constraint.set('relatives', this);
                constraint.set('proxy_references', this.get('target'));
                var data = [
                    ['translationDelta_xy', 'translationDelta_xy', ['interpolate', 'interpolate']],
                    ['scalingDelta_xy', 'scalingDelta_xy', ['interpolate', 'interpolate']],
                    ['fillColor_hsl', 'fillColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                    ['strokeColor_hsl', 'strokeColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                    ['rotationDelta_v', 'rotationDelta_v', ['interpolate', 'interpolate']],
                    ['strokeWidth_v', 'strokeWidth_v', ['interpolate', 'interpolate']]
                ];
                constraint.create(data);
                constraints.push(constraint);
                return constraints;
            },

            setInternalGroupConstraint: function() {
                var member_constraints = [];
                var target = this.get('target');
                for (var i = 0; i < target.members.length; i++) {
                    var relative_list = new ConstrainableList();
                    var reference_list = new ConstrainableList();
                    relative_list.set('id', 'internal' + relative_list.get('id'));
                    relative_list.get('ui').remove();
                    reference_list.set('id', 'internal' + reference_list.get('id'));
                    reference_list.get('ui').remove();

                    this.group_relative.push(relative_list);
                    this.group_reference.push(reference_list);
                    reference_list.addMember(target.members[i]);
                    if (this.members.length > 1) {
                        reference_list.addMember(this.members[this.members.length - 1].members[i]);
                    }
                    for (var j = 0; j < this.members.length; j++) {
                        relative_list.addMember(this.members[j].members[i]);
                    }
                    var constraint = new Constraint();
                    constraint.set('references', reference_list);
                    constraint.set('relatives', relative_list);
                    constraint.set('proxy_references', target.members[i]);
                    constraint.set('proxy_relatives', this.members[1].members[i]);
                    var data = [
                        ['translationDelta_xy', 'translationDelta_xy', ['interpolate', 'interpolate']],
                        ['scalingDelta_xy', 'scalingDelta_xy', ['interpolate', 'interpolate']],
                        ['fillColor_hsl', 'fillColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                        ['strokeColor_hsl', 'strokeColor_hsl', ['interpolate', 'interpolate', 'interpolate']],
                        ['rotationDelta_v', 'rotationDelta_v', ['interpolate', 'interpolate']],
                        ['strokeWidth_v', 'strokeWidth_v', ['interpolate', 'interpolate']]
                    ];
                    constraint.create(data);
                    member_constraints.push(constraint);
                }
                return member_constraints;
            },

            addRelativeMember: function(copy, index) {

                if (this.members.length > 1) {

                    copy.setValue(this.members[this.members.length - 2].getValue());

                    if (!index) {
                        index = this.members.length - 1;
                    }
                } else {

                    copy.setValue(this.members[0].getValue());

                    if (!index) {
                        index = 1;
                    }
                }

                this.addMember(copy, index);

            },

            addMember: function(member, index) {

                if (index) {
                    console.log('index =',index);
                    this.members.splice(index, 0, member);
                    this.insertChild(index, member);
                    this.get('geom').insertChild(index, member.get('geom'));
                   // member.get('zIndex').setValue(index);

                } else {
                    this.members.push(member);
                    this.get('geom').addChild(member.get('geom'));
                    this.addChildNode(member);

                    member.get('zIndex').setValue(this.members.length - 1);

                }
                var diff = this.members.length - this.indexNumbers.length;
                if (member.get('name') === 'group') {
                    for (var j = 0; j < member.members.length; j++) {
                        for (var i = 0; i < this.group_relative.length; i++) {
                            this.group_relative[j].addMember(member.members[j], index);
                        }
                    }
                }
                this.addMemberNotation();

            },

            addMemberToOpen: function(data) {
                if (this.get('open')) {
                    var addedToList = false;
                    for (var i = 0; i < this.members.length; i++) {
                        var added = this.members[i].addMemberToOpen(data);
                        if (added) {
                            addedToList = true;
                        }
                    }
                    if (addedToList) {
                        if (data.get('type') === 'collection') {
                            for (var j = 0; j < data.members.length; j++) {
                                var removed = this.removeMember(data.members[j]);
                            }
                        }
                        return true;
                    }
                }
                return false;
            },



            deleteRelativeMember: function() {
                var data = this.members[this.members.length - 2];
                if (data) {
                    this.removeMember(data);
                    data.deleteSelf();
                    var parent = data.getParentNode();
                    if (parent) {
                        parent.removeChildNode(data);
                    }
                    return data;
                }
            },

            deleteMember: function(member,removeAll) {

                this.removeMember(member,false, removeAll);
                member.deleteSelf();
                var parent = member.getParentNode();
                if (parent) {
                    parent.removeChildNode(member);
                }
                return member;

            },

            // sets the geom visibility to false
        hide: function() {
           Instance.prototype.hide.call(this);
        },

        show: function() {
             Instance.prototype.show.call(this);

        },

            /*deleteAllChildren
             * function which deletes all children
             */
            deleteAllChildren: function() {
                                console.log('calling delete children duplicator');

                this.internalList.deleteSelf();
                this.internalList = null;
                for (var i = 0; i < this.group_relative.length; i++) {
                    this.group_relative[i].deleteSelf();
                }
                for (var j = 0; i < this.group_reference.length; j++) {
                    this.group_reference[j].deleteSelf();
                }
                
                 var   deleted = [];
                
                for (var k = this.members.length - 1; k >= 0; k--) {
                    console.log('deleting member at',i,this.members.length);
                    deleted.push.apply(deleted, this.members[k].deleteAllChildren());
                    var deleted_member = this.deleteMember(this.members[k],true);
                    deleted.push(deleted_member);
                }
                this.members.length = 0;
                this.children.length = 0;
                return deleted;
            },


            deleteSelf: function() {
                console.log('calling delete self duplicator');
                this.stopListening();
                
                var data = ConstrainableList.prototype.deleteSelf.call(this);
               
                return data;
            },


            removeMember: function(data, updateCount,fullDelete) {
                console.log('data',data);
                var target = this.get('target');
                if (!fullDelete && this.internalList.hasMember(data, true, this)) {
                    return false;
                }
                var index = $.inArray(data, this.members);
                var member;

                if (index > -1) {

                    member = this.members.splice(index, 1)[0];
                    var childIndex = member.get('geom').index;
                    this.get('geom').removeChildren(childIndex, childIndex + 1);
                    this.removeChildNode(member);

                }
                if (data.get('name') === 'group') {
                    for (var j = 0; j < data.members.length; j++) {
                        for (var i = 0; i < this.group_relative.length; i++) {
                            this.group_relative[j].removeMember(data.members[j]);
                        }
                    }
                }
                this.removeMemberNotation();
                if (updateCount) {
                    for (var k = 0; k < this.members.length; k++) {
                        this.members[k].get('zIndex').setValue(k);
                    }
                    this.get('memberCount').setValue(this.members.length);
                }
                return member;
            },

            shiftTarget: function(index) {
                var old_target = this.get('target');

                var newTarget = this.members[index];
                this.set('target', newTarget);
                for (var i = 0; i < this.members.length; i++) {
                    if (i != index) {
                        this.members[i].changeGeomInheritance(newTarget.getShapeClone(true));
                    }
                }
                this.internalList.addMember(this.get('target'), 0);
                //this.internalList.removeMember(this.get('target'));


            },


            setCount: function(count) {
                this.get('count').setValue(count);
                var data;
                switch (this.get('mode')) {
                    case 'standard':
                        data = this.updateCountStandard();
                        break;
                }


                for (var i = 0; i < this.members.length; i++) {
                    this.members[i].get('zIndex').setValue(i);
                }
                var memberCount = {
                    v: this.members.length,
                    operator: 'set'
                };
                this.get('memberCount').setValue(memberCount);
                return data;

            },

            getCountValue: function() {
                return this.get('count').getValue();
            },

            updateCountStandard: function() {
                var count = this.get('count').getValue();
                var range = this.getRange();
                var diff = count - range;
                var target = this.get('target');

                var toRemove = [];
                var toAdd = [];
                if (diff > 0) {
                    for (var i = 0; i < diff; i++) {
                        var member = target.create();
                        this.addRelativeMember(member);
                        toAdd.push(member);

                    }
                } else if (diff < 0) {
                    for (var j = 0; j < 0 - diff; j++) {
                        var d_member = this.deleteRelativeMember();
                        if (d_member) {
                            toRemove.push(d_member);
                        }
                    }
                }
                return {
                    toAdd: toAdd,
                    toRemove: toRemove
                };
            },

            setTarget: function(target) {
                if (target) {
                    this.set('target', target);
                    if (_.indexOf(this.members, target) < 0) {
                        this.addMember(target);
                    }
                } else {
                    this.set('target', null);
                }
                this.get('memberCount').setValue(this.members.length);
            },

            render: function() {
                ConstrainableList.prototype.render.call(this);

            }


        });
        return Duplicator;

    });