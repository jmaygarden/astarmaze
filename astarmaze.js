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

var TIMESTEP = 33;

function make_background(width, height, size) {
    var canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    var ctx = canvas.getContext('2d');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    for (var y = -0.1; y < height; y += size) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    for (var x = -0.1; x < width; x += size) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    ctx.strokeStyle = 'gray';
    ctx.stroke();

    return canvas;
}

function make_field(width, height) {
    var field = [];

    for (var x = 0; x < width; x += 1) {
        line = [];
        for (var y = 0; y < height; y += 1) {
            line.push('?');
        }
        field.push(line);
    }

    return field;
}

function Map (canvas) {
    var map = this;

    this.fieldWidth = 32,
        this.fieldHeight = 32,

        this.ctx = canvas.getContext('2d');
    this.ctx.drawPolygon = function(v) {
        this.beginPath();
        this.moveTo(v[0][0], v[0][1]);
        for (var i = 1; i < v.length; ++i) {
            this.lineTo(v[i][0], v[i][1]);
        }
        this.closePath();
    }

    this.width = canvas.width;
    this.height = canvas.height;

    this.numNodes = this.fieldWidth * this.fieldHeight;
    this.nodeSize = canvas.width / Math.sqrt(this.numNodes);

    this.field = make_field(this.fieldWidth, this.fieldHeight);
    this.frontier = [];
    this.make_maze(this.field, this.fieldWidth, this.fieldHeight);

    this.background = make_background(this.width, this.height, this.nodeSize);

    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.width, this.height);
    this.ctx.clip();
    this.ctx.fillStyle = 'black';
    this.ctx.strokeStyle = 'black';

    this.keystate = new Array();
    document.onkeydown = function(event) {
        map.keystate[event.keyCode] = true;
    };
    document.onkeyup = function(event) {
        map.keystate[event.keyCode] = false;
    };
}

Map.prototype.carve = function(x, y) {
    var extra = [];
    this.field[x][y] = '.';

    function check(field, extra, x, y) {
        if (field[x][y] == '?') {
            field[x][y] = ',';
            extra.push([x, y]);
        }
    }

    if (x > 0) {
        check(this.field, extra, x-1, y);
    }
    if (x < this.fieldWidth - 1) {
        check(this.field, extra, x+1, y);
    }
    if (y > 0) {
        check(this.field, extra, x, y-1);
    }
    if (y < this.fieldHeight - 1) {
        check(this.field, extra, x, y+1);
    }

    shuffle(extra);
    this.frontier.push.apply(this.frontier, extra);
}

Map.prototype.harden = function(x, y) {
    this.field[x][y] = '#';
}

Map.prototype.make_maze = function() {
    x = Math.floor(this.fieldWidth * Math.random());
    y = Math.floor(this.fieldHeight * Math.random());
    this.carve(x, y);
}

Map.prototype.check = function(x, y) {
    var edgestate = 0;

    if (x > 0 && this.field[x-1][y] == '.') {
        edgestate += 1;
    }
    if (x < this.fieldWidth-1 && this.field[x+1][y] == '.') {
        edgestate += 2;
    }
    if (y > 0 && this.field[x][y-1] == '.') {
        edgestate += 4;
    }
    if (y < this.fieldHeight-1 && this.field[x][y+1] == '.') {
        edgestate += 8;
    }

    switch (edgestate) {
        case 1:
            if (x < this.fieldWidth-1) {
                if (y > 0 && this.field[x+1][y-1] == '.') {
                    return false;
                }
                if (y < this.fieldHeight-1 && this.field[x+1][y+1] == '.') {
                    return false;
                }
            }
            return true;

        case 2:
            if (x > 0) {
                if (y > 0 && this.field[x-1][y-1] == '.') {
                    return false;
                }
                if (y < this.fieldHeight-1 && this.field[x-1][y+1] == '.') {
                    return false;
                }
            }
            return true;

        case 4:
            if (y < this.fieldHeight-1) {
                if (x > 0 && this.field[x-1][y+1] == '.') {
                    return false;
                }
                if (x < this.fieldWidth-1 && this.field[x+1][y+1] == '.') {
                    return false;
                }
            }
            return true;

        case 8:
            if (y > 0) {
                if (x > 0 && this.field[x-1][y-1] == '.') {
                    return false;
                }
                if (x < this.fieldWidth-1 && this.field[x+1][y-1] == '.') {
                    return false;
                }
            }
            return true;

        default:
            return false;
    }
}

Map.prototype.step = function() {
    var pos = Math.floor(this.frontier.length * Math.random());
    var choice = this.frontier[pos];
    if (this.check(choice[0], choice[1])) {
        this.carve(choice[0], choice[1]);
    } else {
        this.harden(choice[0], choice[1]);
    }
    this.frontier.splice(pos, 1);
    console.log(this.frontier.length, pos, choice);
}

Map.prototype.render = function() {
    var ctx = this.ctx;

    ctx.drawImage(this.background, 0, 0);

    for (var x = 0; x < this.field.length; x += 1) {
        for (var y = 0; y < this.field[x].length; y += 1) {
            if ('#' == this.field[x][y]) {
                ctx.fillStyle = 'black';
                ctx.fillRect(x * this.nodeSize, y * this.nodeSize,
                        this.nodeSize, this.nodeSize);
            } else if (',' == this.field[x][y]) {
                ctx.fillStyle = 'yellow';
                ctx.fillRect(x * this.nodeSize, y * this.nodeSize,
                        this.nodeSize, this.nodeSize);
            } else if ('?' == this.field[x][y]) {
                ctx.fillStyle = 'gray';
                ctx.fillRect(x * this.nodeSize, y * this.nodeSize,
                        this.nodeSize, this.nodeSize);
            }
        }
    }
}

Map.prototype.update = function(t, dt) {
    if (0 < this.frontier.length) {
        this.step();
    }
}

{
    var next, dt, max, map;

    next = (new Date).getTime();
    dt = TIMESTEP / 1000;
    max = 10;
    map = new Map(document.getElementById('canvas'));

    function update() {
        map.update((new Date).getTime() / 1000.0, dt)
    }

    function render() {
        map.render()
    }

    render();
    map.step();

    window.setInterval(function() {
        var i = 0;

        while ((new Date).getTime() > next && i < max) {
            update();
            next += TIMESTEP;
            i++;
        }

        if (0 < i)
        render();
    } , 0);
}

