var canvas = document.querySelector("#canvas");
var ctx = canvas.getContext("2d");

var WIDTH = canvas.width = document.body.clientWidth;
var HEIGHT = canvas.height = document.body.clientHeight;
var MAX_TEMPERATURE = 100;
var MIN_TEMPERATURE = 20;
ctx.fillStyle = "#333";
ctx.fillRect(0,0,WIDTH, HEIGHT);
function map(val, minValue, maxValue, min, max) {
    if (maxValue < minValue) {
        [maxValue, minValue] = [minValue, maxValue];
    }
    if (max < min) {
        [max, min] = [min, max];
    }
    val = (val > maxValue) ? maxValue : val;
    val = (val < minValue) ? minValue : val;

    return (val - minValue) / (maxValue - minValue + 0.0) * (max - min) + min;
}

function getColor(t) {
    var mapped = Math.round(map(t, MIN_TEMPERATURE, MAX_TEMPERATURE, 0, 16));
    r = mapped * 16;
    g = mapped * 16;
    b = mapped * 16;
    return `rgb(${r}, ${g}, ${b})`;

    /*
    var mapped = map(t, MIN_TEMPERATURE, MAX_TEMPERATURE, 0.0,1.0);
    if (mapped > 0.66666666) {
        return "#fff";
    }
    else if (mapped > 0.5) {
        return "#f00";
    }
    else {
        return "#000";
    }
    */
    var r = 0;

    var g = 0;
    var b = 0;    
    var WHITE_T = 10;
    if (t < MAX_TEMPERATURE - WHITE_T){//t < MAX_TEMPERATURE - WHITE_T) {
        var mapped = map(t, MIN_TEMPERATURE, MAX_TEMPERATURE-WHITE_T, 0,255);
        r = Math.round(mapped);
        g = 0;
        b = Math.round(255 - mapped);    
    } else {
        var mapped = map(t, MAX_TEMPERATURE - WHITE_T, MAX_TEMPERATURE, 0, 255);
        r = 255;
        g = Math.round(mapped);
        b = Math.round(mapped);
    }
    
    return `rgb(${r}, ${g}, ${b})`;
}

function Element(x,y, w, h, t = 0) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.t = t;
}
Element.prototype = {
    draw: function() {
        let color = getColor(this.t);
        var lastColor = ctx.fillStyle;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.w, this.h);

        ctx.fillStyle = lastColor;
    },
    updateAll: function(top, right, bottom, left) {
        var sum = 0;
        var n = 0;
        if (typeof top != 'undefined') {
            sum += top.t;
            n++;
        }
        if (typeof right != 'undefined') {
            sum += right.t;
            n++;
        }
        if (typeof bottom != 'undefined') {
            sum += bottom.t;
            n++;
        }
        if (typeof left != 'undefined') {
            sum += left.t;
            n++;
        }
        if (n != 0) {
            this.t = (sum + this.t * 2)/ (n + 2);
            //this.t = sum / n;
        }
    }
};

var elements = [];
var elemN = 80;
var elemM = 40;
var edgeWidth = 10;
var startI = elemN / 2 - edgeWidth / 2;
var endI = startI + edgeWidth;
var edgeLength = 50;
var size = {width: 6, height: 6};
for (var i = 0; i < elemN; i++) {
    elements.push([]);
    elements[i] = [];
    var len = (i >= startI && i <= endI) ? elemM + edgeLength : elemM;
    for (var j = 0; j < len; j++) {
        //var temp = (j == 0) ? MAX_TEMPERATURE : MIN_TEMPERATURE;
        var temp = MIN_TEMPERATURE;
        elements[i].push(new Element(10 + size.width * j, 10 + size.height * i, size.width, size.height, temp));
    }
}
function getEl(i,j) {
    if (i<0)
        return undefined;
    if (j<0)
        return undefined;
    try {
        return elements[i][j];
    } catch(e) {
        return undefined;
    }
}
function isRight(i, j) {
    if (i < startI || i > endI) {
        return j == elemM - 1;
    } else {
        return j == edgeLength + elemM - 1;
    }
}
function isTopOfEdge(i,j) {
    return j >= elemM && (i == startI || i == endI);
}
function isCold(i,j) {
    return isRight(i,j) || isTopOfEdge(i,j);
}
var KMAX = 0.113352981;
var KMIN = KMAX * .085;
function move(elem, i, j, arr) {
    if (j == 0) {
        //elem.t = MAX_TEMPERATURE;
        
        elem.updateAll(getEl(i-1,j),getEl(i+1,j),getEl(i,j-1),getEl(i,j+1)); 
        elem.t = elem.t + (MAX_TEMPERATURE - elem.t)*KMAX;
        
    } else if (isCold(i,j)) {
        
        elem.updateAll(getEl(i-1,j),getEl(i+1,j),getEl(i,j-1),getEl(i,j+1)); 
        elem.t = elem.t + (MIN_TEMPERATURE - elem.t)*KMIN;
        
    } else
    {
        elem.updateAll(getEl(i-1,j),getEl(i+1,j),getEl(i,j-1),getEl(i,j+1));  
    }
}
function moveLine(elem, i, arr) {
    elem.forEach((e, j, arr) => {
        move(e,i,j,arr);
    });
}
function drawLine(line, i, arr) {
    line.forEach(e => e.draw());
}
function drawFirstGraph() {
    var x = [];
    var y = [];
    var x_center = 10;
    var y_center = elements[elements.length-1][0].y + 170;
    var dx = 10;
    var dy = 1;
    x = elements[elemN / 2].map((e,i) => i);
    y = elements[elemN / 2].map(e => e.t);
    var x_min = 0;
    var x_max = elements[elemN / 2].length - 1;
    var y_min = y.reduce((c,e) => (c < e) ?  c : e);
    var y_max = y.reduce((c,e) => (c < e) ?  e : c);
    x = x.map(e => map(e, x_min, x_max, 0, (elemM + edgeLength)*size.width));
    y = y.map(e => map(e, y_min, y_max, 0, 80));
    ctx.beginPath();
    ctx.moveTo(x_center + x[0], y_center-y[0]);
    for (var i = 1; i < x.length; i++){
        ctx.lineTo(x_center + x[i], y_center - y[i]);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.moveTo(elements[elemN / 2][0].x +size.width / 2-5,elements[elemN / 2][0].y+size.height/ 2);
    ctx.lineTo(elements[elemN / 2][elements[elemN / 2].length -1].x+size.width / 2 + 5,elements[elemN / 2][elements[elemN / 2].length -1].y+size.height / 2);
    ctx.stroke();
    console.log("Y_min: ", y_min,"Y_max: ", y_max);
}
function drawSecondGraph() {
    var x = [];
    var y = [];
    var x_center = (elemM + edgeLength) * size.width + 30;
    var y_center = elemN * size.height + 10;
    var dx = 10;
    var dy = 1;
    for (var i = 0; i < elemN; i++){
        x.push(i);
        y.push(elements[i][elemM - 5].t);
    }
    var x_min = 0;
    var x_max = elemN;
    var y_min = y.reduce((c,e) => (c < e) ?  c : e);
    var y_max = y.reduce((c,e) => (c < e) ?  e : c);
    x = x.map(e => map(e, x_min, x_max, 0, elements[elemN -1][0].y - elements[0][0].y));
    y = y.map(e => map(e, y_min, y_max, 0, 160));
    ctx.beginPath();
    ctx.moveTo(x_center+y[0],y_center- x[0]);
    for (var i = 1; i < x.length; i++){
        ctx.lineTo(x_center + y[i],y_center - x[i]);
    }
    ctx.stroke();
    ctx.closePath();
    ctx.beginPath();
    ctx.strokeStyle = "#f00";
    ctx.moveTo(elements[0][elemM - 2].x +size.width / 2,elements[0][elemM - 2].y+size.height/ 2);
    ctx.lineTo(elements[elements.length-1][elemM - 2].x+size.width / 2,elements[elements.length-1][elemM - 2].y+size.height / 2);
    ctx.stroke();
    console.log("Y_min: ", y_min,"Y_max: ", y_max);

}
setInterval(function() {
    ctx.fillStyle = "#aaffaa";
    ctx.fillRect(0,0,WIDTH, HEIGHT);
    elements.forEach(drawLine);

    for (let j = 0; j < 100;j++) {
        elements.forEach(moveLine);
    }
    drawFirstGraph();
    drawSecondGraph();
}, 0);




