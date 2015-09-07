/*Duplicator.js
 * list which can enact iterative constraints on its members
 */

define([
        'underscore',
        'models/data/Instance',
        'models/data/collections/ConstrainableList',
        'models/data/geometry/PathNode',
        'models/data/geometry/RectNode',
        'models/data/geometry/EllipseNode',
        'models/data/geometry/PolygonNode',
        'utils/PFloat',
        'utils/PBool',
        'paper',
        'utils/PConstraint',
        'models/data/Constraint',
        'utils/TrigFunc'

    ],

    function(_, Instance, ConstrainableList, PathNode, RectNode, EllipseNode, PolygonNode, PFloat, PBool, paper, PConstraint, Constraint, TrigFunc) {
        var init_lookup = {
            'path': PathNode,
            'ellipse': EllipseNode,
            'polygon': PolygonNode,
            'Rectangle': RectNode,
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

            },

            toJSON: function() {
                var data = ConstrainableList.prototype.toJSON.call(this, data);
                data.target_index = this.members.indexOf(this.get('target'));
                var secondary_index = this.members.indexOf(this.internalList.members[1]);
                return data;
            },


            parseJSON: function(data) {
                Instance.prototype.parseJSON.call(this, data);
                var target_index = data.target_index;
                var target_data = data.children[target_index];
                var target = this.getTargetClass(target_data.name);
                target.parseJSON(target_data);
                this.setTarget(target);

                for (var i = 0; i < data.children.length; i++) {
                    if (i != target_index) {
                        var name = data.children[i].name;
                        var child = this.getTargetClass(name);
                        child.parseJSON(data.children[i]);
                        this.addMember(child, i);
                    }
                }
                var memberCount = {
                    v: this.members.length,
                    operator: 'set'
                };
                 for (var j = 0; j < this.members.length; j++) {
                    this.members[j].get('zIndex').setValue(j);
                }
                this.get('memberCount').setValue(memberCount);
                this.toggleClosed(this);
                return this;

            },

            /*returns new child instance based on string name
             */
            getTargetClass: function(name) {
                var target_class = init_lookup[name];
                var child = new target_class();
                return child;
            },

            setInternalConstraint: function() {
                var constraints = [];
                if (this.get('target').get('name') == 'group') {
                    constraints.push.apply(constraints, this.setInternalGroupConstraint());
                }
                this.internalList.addMember(this.get('target'));
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
                    this.group_relative.push(relative_list);
                    this.group_reference.push(reference_list);
                    reference_list.addMember(target.members[i]);
                    /*if (this.members.length > 1) {
                        reference_list.addMember(this.members[this.members.length - 1].members[i]);
                    }*/
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
                    
                    if(!index){
                        index = this.members.length - 1;
                    }
                } else {
                    
                     copy.setValue(this.members[0].getValue());
                    
                    if(!index){
                        index = 1;
                    }
                }

                this.addMember(copy,index);
            },

            addMember: function(member, index) {

                if (index) {
                    this.members.splice(index, 0, member);
                    this.insertChild(index,member);
                    this.get('geom').insertChild(index,member.get('geom'));
                    member.get('zIndex').setValue(index);

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
                var data = this.members[this.members.length-2];
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

            deleteMember: function(member) {

                this.removeMember(member);
                member.deleteSelf();
                var parent = member.getParentNode();
                if (parent) {
                    parent.removeChildNode(member);
                }
                return member;

            },

            /*deleteAllChildren
             * function which deletes all children
             */
            deleteAllChildren: function(deleted) {
                if (!deleted) {
                    deleted = [];
                }
                for (var i = this.members.length - 1; i >= 0; i--) {
                    deleted.push.apply(deleted, this.members[i].deleteAllChildren());
                    deleted.push(this.deleteMember(this.members[i]));
                }
                this.members.length = 0;
                this.children.length = 0;
                return deleted;
            },


            deleteSelf: function() {
                this.internalList.deleteSelf();
                for (var i = 0; i < this.group_relative.length; i++) {
                    this.group_relative[i].deleteSelf();
                }
                for (var j = 0; i < this.group_reference.length; j++) {
                    this.group_reference[j].deleteSelf();
                }
                return ConstrainableList.prototype.deleteSelf.call(this);
            },


            removeMember: function(data, updateCount) {
                var target = this.get('target');
                if (this.internalList.hasMember(data,true,this)) {
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
                    console.log('updating member count',updateCount);

                if(updateCount){
                    for (var i = 0; i < this.members.length; i++) {
                        this.members[i].get('zIndex').setValue(i);
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
                    if(i!=index){
                        this.members[i].changeGeomInheritance(newTarget.getShapeClone(true));
                    }
                }
                this.internalList.addMember(this.get('target'),0);
                //this.internalList.removeMember(this.get('target'));

                console.log('new target',this.get('target'),this.internalList.members);

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