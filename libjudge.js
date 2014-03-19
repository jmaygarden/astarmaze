/*
 * Copyright (C) 2012 Judge Maygarden (wtfpl.jmaygarden@safersignup.com)
 *
 *            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *                    Version 2, December 2004
 *
 * Copyright (C) 2004 Sam Hocevar <sam@hocevar.net>
 *
 * Everyone is permitted to copy and distribute verbatim or modified
 * copies of this license document, and changing it is allowed as long
 * as the name is changed.
 *
 *            DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE
 *   TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION
 *
 *  0. You just DO WHAT THE FUCK YOU WANT TO.
 *
 */

var V2 = {};
V2.cp = function V2_clone(a) { return [a[0], a[1]]; }
V2.add = function V2_add(a, b, r) {
    if (undefined == r)
        r = new Array(2);
    r[0] = a[0] + b[0];
    r[1] = a[1] + b[1];
    return r;
}
V2.sub = function V2_add(a, b, r) {
    if (undefined == r)
        r = new Array(2);
    r[0] = a[0] - b[0];
    r[1] = a[1] - b[1];
    return r;
}
V2.scale = function V2_scale(a, k, r) {
    if (undefined == r)
        r = new Array(2);
    r[0] = k * a[0];
    r[1] = k * a[1];
    return r;
}
V2.lengthSquared = function V2_lengthSquared(a) {
    return a[0] * a[0] + a[1] * a[1];
}
V2.length = function V2_length(a) {
    return Math.sqrt(V2.lengthSquared(a));
}
V2.normalize = function V2_normalize(a, r) {
    var length = V2.length(a);
    if (0.000001 > length)
        length = 1.0;
    if (undefined == r)
        r = new Array(2);
    r[0] = a[0] / length;
    r[1] = a[1] / length;
    return r;
}
V2.toString = function V2_toString(a) {
    return "(" + a[0] + ", " + a[1] + ")";
}

function rk4_intialize(state, t, forces) {
    var tmp = forces(state, t);
    return {
        velocity: state.velocity,
        angularVelocity: state.angularVelocity,
        force: tmp.force,
        torque: tmp.torque
    };
}

function rk4_evaluate(state, t, dt, derivative, forces) {
    var tmp = [0, 0];

    V2.scale(derivative.velocity, dt, tmp);
    V2.add(state.position, tmp, state.position);
    V2.scale(derivative.force, dt, tmp);
    V2.add(state.momentum, tmp, state.momentum);
    state.orientation += derivative.angularVelocity * dt;
    state.angularMomentum += derivative.torque * dt;
    state.recalculate();

    tmp = forces(state, t + dt);
    return {
        velocity: state.velocity,
        angularVelocity: state.angularVelocity,
        force: tmp.force,
        torque: tmp.torque
    };
}

function PhysicsState() {
    // primary
    this.position = [0, 0];
    this.momentum = [0, 0];
    this.orientation = 0;
    this.angularMomentum = 0;

    // secondary
    this.velocity = [0, 0];
    this.direction = [0, 0];
    this.angularVelocity = 0;

    // constant
    this.mass = 1;
    this.inverseMass = 1;
    this.inertia = 1;
    this.inverseInertia = 1;
}

PhysicsState.prototype = {
    recalculate: function() {
        V2.scale(this.momentum, this.inverseMass, this.velocity);
        this.direction[0] = Math.cos(this.orientation);
        this.direction[1] = Math.sin(this.orientation);
        this.angularVelocity = this.angularMomentum * this.inverseInertia;
    },

    integrate: function(t, dt, forces) {
        var a = rk4_intialize(this, t, forces);
        var b = rk4_evaluate(this, t, 0.5 * dt, a, forces);
        var c = rk4_evaluate(this, t, 0.5 * dt, b, forces);
        var d = rk4_evaluate(this, t, dt, c, forces);

        this.position[0] += dt / 6.0 * (a.velocity[0] + 2.0 * (b.velocity[0] + c.velocity[0]) + d.velocity[0]);
        this.position[1] += dt / 6.0 * (a.velocity[1] + 2.0 * (b.velocity[1] + c.velocity[1]) + d.velocity[1]);
        this.momentum[0] += dt / 6.0 * (a.force[0] + 2.0 * (b.force[0] + c.force[0]) + d.force[0]);
        this.momentum[1] += dt / 6.0 * (a.force[1] + 2.0 * (b.force[1] + c.force[1]) + d.force[1]);
        this.orientation += dt / 6.0 * (a.angularVelocity + 2.0 * (b.angularVelocity + c.angularVelocity) + d.angularVelocity);
        this.angularMomentum += dt / 6.0 * (a.torque + 2.0 * (b.torque + c.torque) + d.torque);
        this.recalculate()
    }
}

function Set() {
    this.list = [];
}

Set.prototype = {
    add: function (obj) {
        this.list.push(obj);
    },

    remove: function (obj) {
        for (var i = 0; i < this.list.length; ++i) {
            if (this.list[i] == obj) {
                this.list.splice(i, 1);
                return true;
            }
        }
        return false;
    },

    foreach: function (f) {
        for (var i = 0; i < this.list.length; ++i) {
            f(this.list[i], i, this)
        }
    },
};

function load_images(sources, onload) {
    var img = {}, i = 0, len = 0;
    for (var key in sources) {
        ++len;
        img[key] = new Image();
        img[key].onload = function() {
            if (++i >= len) {
                onload();
            }
        };
        img[key].src = sources[key];
    }
    return img;
}

// Fisher-Yates Shuffle ( http://stackoverflow.com/q/6274339/1491 )
function shuffle(array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter > 0) {

        // Pick a random index
        index = Math.floor(Math.random() * counter);

        // Decrease counter by 1
        counter--;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

