/*
Copyright 2013 Daniel Wirtz <dcode@dcode.io>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * @license JustMath.js (c) 2013 Daniel Wirtz <dcode@dcode.io>
 * Released under the Apache License, Version 2.0
 * see: https://github.com/dcodeIO/JustMath.js for details
 */
(function(global, Math) {
    "use strict";
    
    // What is done here is to lend the core math from the environments Math module. By doing so, it's possible to
    // replace some or all of the core ops by our own implementations if needed. Additionally some convenience
    // functions are introduced to easily work with, like sq() or cot(), and Vec2 is exposed on top of the
    // namespace. Nice side-effect: Even catchier documentation by being able to refer to what's basically just core
    // Math.
    
    /**
     * „Nope, just Math.“
     * @exports JustMath
     * @namespace
     */
    var JustMath = {};
    
    // Constants
    
    /**
     * Represents the ratio of the circumference of a circle to its diameter, specified by the constant, π.
     * @type {number}
     * @const
     */
    JustMath.PI = Math.PI;
    
    /**
     * Respresents the square root of 2.
     * @type {number}
     * @const
     */
    JustMath.SQRT2 = Math.SQRT2;
    
    /**
     * Respresents the square root of 1/2.
     * @type {number}
     * @const
     */
    JustMath.SQRT1_2 = Math.SQRT1_2;
    
    // Functions
    
    /**
     * Calculates the absolute of the specified number.
     * @function
     * @param {number} n Number
     * @return {number} Absolute value
     */
    JustMath.abs = Math.abs;
    
    /**
     * Returns the lesser of the two specified numbers.
     * @function
     * @param {number} n Number
     * @param {number} m Number
     * @return {number} The lesser of the two specified numbers
     */
    JustMath.min = Math.min;
    
    /**
     * Returns the biffer of the two specified numbers.
     * @function
     * @param {number} n Number
     * @param {number} m Number
     * @return {number} The bigger of the two specified numbers
     */
    JustMath.max = Math.max;
    
    /**
     * Floors the specified number.
     * @function
     * @param {number} n Number
     * @return {number} Floored value
     */
    JustMath.floor = Math.floor;
    
    /**
     * Ceils the specified number.
     * @function
     * @param {number} n Number
     * @return {number} Ceiled value
     */
    JustMath.ceil = Math.ceil;
    
    /**
     * Rounds the specified number.
     * @function
     * @param {number} n Number
     * @return {number} Rounded value
     */
    JustMath.round = Math.round;
    
    /**
     * Calculates the square root of the specified number.
     * @function
     * @param {number} n Number
     * @return {number} Square root of the specified number
     */
    JustMath.sqrt = Math.sqrt;
    
    /**
     * Calculates the square of the specified number.
     * @function
     * @param {number} n Number
     * @return {number} The square of the specified number
     */
    JustMath.sq = function(n) { return n*n; };
    
    /**
     * Calculates the specified number raised to the specified power.
     * @function
     * @param {number} n Number
     * @param {number} p Power
     * @return {number} The specified number raised to the specified power
     */
    JustMath.pow = Math.pow;
    
    /**
     * Calculates the sine of the specified angle.
     * @function
     * @param {number} a Angle
     * @return {number} Sine of the specified angle
     */
    JustMath.sin = Math.sin;
    
    /**
     * Calculates the cosine of the specified angle.
     * @function
     * @param {number} a Angle
     * @return {number} Cosine of the specified angle
     */
    JustMath.cos = Math.cos;
    
    /**
     * Calculates the tangent of the specified angle.
     * @function
     * @param {number} a Angle
     * @return {number} Tangent of the specified angle
     */
    JustMath.tan = Math.tan;
    
    /**
     * Calculates the cotangent of the specified angle.
     * @function
     * @param {number} a Angle
     * @return {number} Cotangent of the specified angle
     */
    JustMath.cot = function(a) { return 1/JustMath.tan(a); };
    
    /**
     * Calculates the angle whose sine is the specified number.
     * @function
     * @param {number} n Number
     * @return {number} The angle whose sine is the specified number
     */
    JustMath.asin = Math.asin;
    
    /**
     * Calculates the angle whose cosine is the specified number.
     * @function
     * @param {number} n Number
     * @return {number} The angle whose cosine is the specified number
     */
    JustMath.acos = Math.acos;
    
    /**
     * Calculates the angle whose tangent is the specified number.
     * @function
     * @param {number} n Number
     * @return {number} The angle whose tangent is the specified number
     */
    JustMath.atan = Math.atan;
    
    /**
     * Calculates the angle whose tangent is the quotient of the two specified values.
     * @function
     * @param {number} y Value
     * @param {number} x Value
     * @return {number} The angle whose tangent is the quotient of the two specified values
     */
    JustMath.atan2 = Math.atan2;
    
    /**
     * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
     * @function
     * @return {number} Pseudo-random number between 0 (inclusive) and 1 (exclusive)
     */
    JustMath.random = Math.random;
    
    /**
     * Constructs a new Vec2.
     * @exports JustMath.Vec2
     * @class Represents a two dimensional vector. Vector operations always affect the initial Vec2 instance and return
     * the instance itself for chaining. So use {@link JustMath.Vec2#clone} where necessary. This is done to
     * reduce the allocation footprint slightly.
     * @param {JustMath.Vec2|number} vOrX Other Vec2 to copy or X coordinate
     * @param {number=} y Y coordinate if vOrX is X coordinate
     * @constructor
     */
    var Vec2 = function Vec2(vOrX, y) {
        
        /**
         * X coordinate.
         * @type {number}
         */
        this.x = 0;
    
        /**
         * Y coordinate.
         * @type {number}
         */
        this.y = 0;
    
        if (arguments.length == 1) {
            this.x = vOrX.x;
            this.y = vOrX.y;
        } else if (arguments.length == 2) {
            this.x = vOrX;
            this.y = y;
        }
    };
    
    /**
     * Clones this Vec2.
     * @return {JustMath.Vec2} Cloned Vec2
     */
    Vec2.prototype.clone = function() {
        return new Vec2(this);
    };
    
    /**
     * Copies this Vec2. This is an alias of {@link JustMath.Vec2#clone}.
     * @function
     * @return {JustMath.Vec2} Copied Vec2
     */
    Vec2.prototype.copy = Vec2.prototype.clone;
    
    /**
     * Gets the X coordinate of this Vec2.
     * @return {number} X coordinate
     */
    Vec2.prototype.getX = function() {
        return this.x;
    };
    
    /**
     * Gets the Y coordinate of this Vec2.
     * @return {number} Y coordinate
     */
    Vec2.prototype.getY = function() {
        return this.y;
    };
    
    /**
     * Gets the coordinate payload of this Vec2.
     * @return {{x: number, y: number}} Coordinate payload
     */
    Vec2.prototype.getXY = function() {
        return {
            "x": this.x,
            "y": this.y
        };
    };
    
    /**
     * Sets the coordinates of this Vec2.
     * @param {JustMath.Vec2|number} vOrX Other Vec2 or X coordinate
     * @param {number=} y Y coordinate if vOrX is X coordinate
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.set = function(vOrX, y) {
        if (arguments.length == 1) {
            if (typeof vOrX != 'object') {
                throw("Not an object: "+vOrX);
            }
            this.x = vOrX.x;
            this.y = vOrX.y;
        } else {
            this.x = vOrX;
            this.y = y;
        }
        return this;
    };
    
    /**
     * Adds a value to this Vec2.
     * @param {JustMath.Vec2|number} vOrX Other Vec2 or X coordinate
     * @param {number=} y Y coordinate if vOrX is X coordinate
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.add = function(vOrX, y) {
        if (arguments.length == 1) {
            this.x += vOrX.x;
            this.y += vOrX.y;
        } else {
            this.x += vOrX;
            this.y += y;
        }
        return this;
    };
    
    /**
     * Subtracts a value from this Vec2.
     * @param {JustMath.Vec2|number} vOrX Other Vec2 or X coordinate
     * @param {number=} y Y coordinate if vOrX is X coordinate
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.sub = function(vOrX, y) {
        if (arguments.length == 1) {
            this.x -= vOrX.x;
            this.y -= vOrX.y;
        } else {
            this.x -= vOrX;
            this.y -= y;
        }
        return this;
    };
    
    /**
     * Inverts this Vec2.
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.inv = function() {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    };
    
    /**
     * Makes this Vec2 an orthogonal of itself by setting x=-y and y=x.
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.ort = function() {
        return this.set(-this.y, this.x);
    };
    
    /**
     * Scales this Vec2 by a factor.
     * @param {number} factor Scaling factor
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.scale = function(factor) {
        this.x *= factor;
        this.y *= factor;
        return this;
    };
    
    /**
     * Calculates the dot product of this and another Vec2.
     * @param {JustMath.Vec2} b Other Vec2
     * @return {number} Dot product
     */
    Vec2.prototype.dot = function(b) {
        return this.x * b.x + this.y * b.y;
    };
    
    /**
     * Normalizes this Vec2.
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.norm = function() {
        var l = JustMath.sqrt(this.dot(this));
        if (l != 0) {
            this.x = this.x / l;
            this.y = this.y / l;
        }
        return this;
    };
    
    /**
     * Calculates the squared distance between this and another Vec2.
     * @param {JustMath.Vec2} b Other Vec2
     * @return {number} Squared distance
     */
    Vec2.prototype.distSq = function(b) {
        var dx = this.x - b.x;
        var dy = this.y - b.y;
        return dx * dx + dy * dy;
    };
    
    /**
     * Calculates the distance between this and another Vec2.
     * This operation requires a call to {@link JustMath.sqrt}.
     * @param {JustMath.Vec2} b Other Vec2
     * @return {number} Distance
     */
    Vec2.prototype.dist = function(b) {
        return JustMath.sqrt(this.distSq(b));
    };
    
    /**
     * Calculates the direction of this Vec2.
     * This operation requires a call to {@link JustMath.atan2}.
     * @return {number} Direction in radians
     */
    Vec2.prototype.dir = function() {
        return JustMath.atan2(this.y, this.x);
    };
    
    /**
     * Calculates the squared magnitude of this Vec2.
     * @return {number} Squared magnitude
     */
    Vec2.prototype.magSq = function() {
        return this.dot(this);
    };
    
    /**
     * Calculates the magnitude of this Vec2.
     * This operation requires a call to {@link JustMath.sqrt}.
     * @return {number} Magnitude
     */
    Vec2.prototype.mag = function() {
        return JustMath.sqrt(this.magSq());
    };
    
    /**
     * Rotates this Vec2 by the given angle.
     * This operation requires a call to {@link JustMath.sin} and {@link JustMath.cos}.
     * @param {number} theta Rotation angle in radians
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.rotate = function(theta) {
        var sin = JustMath.sin(theta);
        var cos = JustMath.cos(theta);
        var x = this.x * cos - this.y * sin;
        this.y = this.x * sin + this.y * cos;
        this.x = x;
        return this;
    };
    
    /**
     * Projects this Vec2 on another Vec2.
     * @param {JustMath.Vec2} b Other Vec2
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.project = function(b) {
        return this.set(b.clone().scale(this.dot(b) / b.dot(b)));
    };
    
    /**
     * Rejects this Vec2 from another Vec2.
     * @param {JustMath.Vec2} b Other Vec2
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.reject = function(b) {
        return this.sub(this.clone().project(b));
    };
    
    /**
     * Reflects this Vec2 from another Vec2.
     * @param {JustMath.Vec2} n Vector to reflect from
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.reflect = function(n) {
        n = n.clone().norm();
        return this.set(n.scale(2*this.dot(n)).sub(this));
    };
    
    /**
     * Reflects this Vec2 from another Vec2 and scales the projected and reflected component by the given factors.
     * @param {JustMath.Vec2} n Vector to reflect from
     * @param {number} projectFactor Projected component factor
     * @param {number} rejectFactor Rejected component factor
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.reflectAndScale = function(n, projectFactor, rejectFactor) {
        var p = n.clone().norm() // Projection direction
            , r = n.clone().ort().norm(); // Rejection direction
        return this.set(p.scale(this.dot(p)*projectFactor).add(r.scale(-this.dot(r)*rejectFactor)));
    };
    
    /**
     * Interpolates the point between this and another point (in that direction) at the given percentage.
     * @param {JustMath.Vec2} p Other point
     * @param {number} percent Percentage
     * @return {JustMath.Vec2} This Vec2
     */
    Vec2.prototype.lerp = function(p, percent) {
        return this.add(p.clone().sub(this).scale(percent));
    };
    
    /**
     * Tests if this Vec2 is contained in the rectangle created between p1 and p2.
     * @param {JustMath.Vec2} p1
     * @param {JustMath.Vec2} p2
     * @return {boolean} true if contained, else false
     */
    Vec2.prototype.inRect = function(p1, p2) {
        return ((p1.x <= this.x && this.x <= p2.x) || (p1.x >= this.x && this.x >= p2.x)) &&
            ((p1.y <= this.y && this.y <= p2.y) || (p1.y >= this.y && this.y >= p2.y));
    };
    
    /**
     * Tests if this Vec2 equals another Vec2.
     * @param {JustMath.Vec2} b Other Vec2
     * @return {boolean} true if equal, false otherwise
     */
    Vec2.prototype.equals = function (b) {
        if (!b || !(b instanceof Vec2)) return false;
        return this.x == b.x && this.y == b.y;
    };
    
    /**
     * Gets a string representation of this Vec2.
     * @return {string} String representation as of "Vec2(x/y)"
     */
    Vec2.prototype.toString = function () {
        return "Vec2("+this.x+"/"+this.y+")";
    };
    
    /**
     * Calculates the determinant of the matrix [v1,v2].
     * @param {JustMath.Vec2} v1 Vector 1
     * @param {JustMath.Vec2} v2 Vector 2
     * @return {number} Determinant of the matrix [v1,v2]
     */
    Vec2.det = function(v1, v2) {
        return v1.x*v2.y - v2.x*v1.y;
    };

    /**
     * @alias JustMath.Vec2
     **/
    JustMath.Vec2 = Vec2;
    
    // Enable module loading if available
    if (typeof module != 'undefined' && module["exports"]) { // CommonJS
        module["exports"] = JustMath;
    } else if (typeof define != 'undefined' && define["amd"]) { // AMD
        define([], function() { return JustMath; });
    } else { // Shim
        if (typeof global["dcodeIO"] == "undefined") {
            global["dcodeIO"] = {};
        }
        global["dcodeIO"]["JustMath"] = JustMath;
    }
    
})(this, Math);
