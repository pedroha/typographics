var error, warn, debug, info, prog; // log: redefinition of log()?

if (!error) {
	error = warn = debug = info = function (msg) {
		if (typeof console !== "undefined") {
			console.log(msg);
		}
	};
}

if (!prog) {
	prog = function (msg) { // Programmer error, not user error
		alert(msg);
	};
}

//-------------------------------------------------

var JF = JF || {};

JF.DrawingSvgCanvasExecutor = function (context) {
	if (!context) {
		prog("DrawingSvgCanvasExecutor: Missing Context argument!");
		return;
	}
	var ctx = context;
	
	var debug_color = "#f7a";
	
	this.beginPath = function () {
		ctx.beginPath();
	};
	this.quadraticCurveTo = function (cpx, cpy, endx, endy) {
		ctx.quadraticCurveTo(cpx, cpy, endx, endy);
	};	
	this.bezierCurveTo = function (cpx, cpy, cp2x, cp2y, endx, endy) {
		ctx.bezierCurveTo(cpx, cpy, cp2x, cp2y, endx, endy);
	};
	this.moveTo = function (x, y) {
		ctx.moveTo(x, y);
	};
	this.lineTo = function (x, y) {
		ctx.lineTo(x, y);
	};
	this.closePath = function () {
		ctx.closePath();
		if (JF.debug.embedded_path_coloring) {
			ctx.fillStyle = debug_color;
			ctx.fill();
		}
	};
};


JF.PolyLine = function() {
	var dots = [];
	this.push = function(x, y) {
		dots.push({x:x, y:y});
	};
	this.get = function() {
		return dots;
	};
	this.translate = function(x, y) {
		var p = new JF.PolyLine();
		for (var i = 0; i < dots.length; i++) {
			var d = dots[i];
			p.push(d.x + x, d.y + y);
		}
		return p;
	}
};


JF.PolyLineSegmentorSvgCanvasExecutor = function (preferredNumSegments,minLength) {
	if (!preferredNumSegments || typeof preferredNumSegments !== 'number') {
		prog("DrawingSvgCanvasExecutor: Missing numeric preferredNumSegments argument!");
		return;
	}
	if (!minLength || typeof minLength !== 'number') {
		prog("DrawingSvgCanvasExecutor: Missing numeric minLength argument!");
		return;
	}
	var polylines = [];
	var polyline = null;

	var debug_color = "#f7a";

	var origin = {};
	var groupId = "";
	
	var last = { x:0, y:0 };

	var createPolyLine = function() {
		var polyline = new JF.PolyLine();
		polyline.groupId = groupId;
		return polyline;
	}

	var moveTo = function(x, y) {
		polyline.push(x, y);
		last.x = x; last.y = y;
	};

	var drawLineTo = function(x, y) {
		if (0) {
			polyline.push(x, y);
			last.x = x; last.y = y;
			return;			
		}

		// Segment the line
		var diffX = x - last.x;
		var diffY = y - last.y;
		var dist = Math.sqrt( Math.pow(diffX, 2) + Math.pow(diffY, 2));
		// alert(">>> " + diffX + "," + diffY + " -> " + dist);

		var numSegments = preferredNumSegments;
		while (numSegments > 1) {
			var segmentLength = dist / numSegments;
			if (segmentLength >= minLength) break;
			numSegments--;
		}
		// console.log(numSegments);

		var incrX = diffX / numSegments;
		var incrY = diffY / numSegments;

		var nx = last.x;
		var ny = last.y;
		for (var i = 0; i < numSegments; i++) {
			nx += incrX;
			ny += incrY;
			polyline.push(nx, ny);
		}
		last.x = x; last.y = y;
	};

	this.beginPath = function () {
		polyline = createPolyLine();
		polylines.push(polyline);
		last = { x:0, y:0 };
	};
	this.quadraticCurveTo = function (cpx, cpy, endx, endy) {
		drawLineTo(endx, endy);
	};	
	this.bezierCurveTo = function (cpx, cpy, cp2x, cp2y, endx, endy) {
		drawLineTo(endx, endy);
	};
	this.moveTo = function (x, y) {
		moveTo(x, y);
	};
	this.lineTo = function (x, y) { // Start with simplest case: line segment
		drawLineTo(x, y);
	};

	this.closePath = function () {
		polyline = createPolyLine();
		polylines.push(polyline);
	};
	
	this.translate = function(groupId, toX, toY) {
		origin[groupId] = {x: toX, y: toY};
	}

	this.getPolyLines = function() {
		//return polylines;
		var result = [];
		for (var i = 0; i < polylines.length; i++) {
			var p = polylines[i];
			var offset = origin[p.groupId];
			var t = p.translate(offset.x, offset.y);
			result.push(t);
		}
		return result;
	};
	
	this.group = function(id) {
		groupId = id;
	}
};
