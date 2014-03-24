// -----------------------------------------------------------------------
// Large enough to consider this into a module: SVG_Parser -> with multiple tests
//
// SVG_Parser.parse(path, pathExecutor)
//
// -----------------------------------------------------------------------

// Reference: http://www.w3.org/TR/SVG/paths.html

// Not implemented to my knowledge 
// The command letter can be eliminated on subsequent commands if the same command is used multiple times in a row (e.g., you can drop the second "L" in "M 100 200 L 200 100 L -100 -200" and use "M 100 200 L 200 100 -100 -200" instead).

// Relative versions of all commands are available (uppercase means absolute coordinates, lowercase means relative coordinates).
// Alternate forms of lineto are available to optimize the special cases of horizontal and vertical lines (absolute and relative).
// Alternate forms of curve are available to optimize the special cases where some of the control points on the current segment can be determined automatically from the control points on the previous segment.

// closePath in subpath -> strokeJoin, strokeCap

/*

JF.Parser = (function() {
	var parser = new Parser();
	
	return {
		parse : function (path, svg_path_executor) {
			parser.parse(path, svg_path_executor);
		}
	};
})();

or

JF.ParserFactory = (function() {
	return {
		createParser : function() {
			return new Parser();
		}
	}
})();

or both (or "allow" for both: singleton, then IF multiple instances needed: factory)

JF.Parser = singleton
JF.ParserFactory = factory singleton

JF.extends( function() {
	var parser = new Parser();

	return {
		Parser : {
			parse : function (path, svg_path_executor) {
				parser.parse(path, svg_path_executor);
		},
		ParserFactory : {
			createParser : function() {
				return new Parser();
			}
		}
	};
});

*/

JF.debug = {
	show_coordinates : false,
	start_glyph : false,
	embedded_path_coloring : false
};

// Need to use "extend", so as not to overwrite current "debug"... or maybe: JF.debug.parser.... or encapsulate more
JF.parser = {
  debug :	{
	show_coordinates : true,
	start_glyph : true,
	embedded_path_coloring : true
  }
};

JF.is_svg_path_command = function (charcode) {
	var result = /[MZLHVCSQTAmzlhvcsqta]/.test(charcode);
	//var result = svg_commands.indexOf(charcode) >= 0; // any performance improvements?
	return result;
};

JF.SvgAbsolutePathExecutioner = function () {
	var svg_canvas_executor;

	// Keep the current state and the control point
	var current_x = 0;
	var current_y = 0;
	var nextcp_x;
	var nextcp_y;
	var last_command;
	
	// Acc to SVG specs: (TODO: closePath() not implemented here yet)
	// var initial_x = 0; // @begin_path: initial = current;
	// var initial_y = 0; // @close_path: if (initial!=current) LineTo(initial), current = initial

	function compute_next_control_point(cp_x, cp_y, end_x, end_y) { // compute next reflection control point
		nextcp_x = (end_x - cp_x) + end_x;
		nextcp_y = (end_y - cp_y) + end_y;
		current_x = end_x;
		current_y = end_y;
	}

	function init_control_point (cmd1, cmd2) {
		var reset_control_point = (last_command !== cmd1 && last_command !== cmd2);
		if (reset_control_point) {
			nextcp_x = current_x;
			nextcp_y = current_y;
		}
		else {
			if (nextcp_x === undefined) { nextcp_x = current_x; }
			if (nextcp_y === undefined) { nextcp_y = current_y; }
		}		
	}
		
	this.set_svg_canvas_executor = function (func) {
		svg_canvas_executor = func;
	};

	this.get_current_point = function () {
		return {
			x : current_x,
			y : current_y
		};
	};
	
	this.begin_path = function () {
		svg_canvas_executor.beginPath();
		last_command = "";
	};

	this.execute_C = function (cpx, cpy, cp2x, cp2y, endx, endy) {
		svg_canvas_executor.bezierCurveTo(cpx, cpy, cp2x, cp2y, endx, endy);
		compute_next_control_point(cp2x, cp2y, endx, endy);
		last_command = "C";
	};

	// For S: we need the "reflection" point from the last control point, through the end point
	this.execute_S = function (cpx, cpy, endx, endy) {
		// Get CP1 (implicit reflection point)
		init_control_point("C", "S");

		svg_canvas_executor.bezierCurveTo(nextcp_x, nextcp_y, cpx, cpy, endx, endy);
				
		// Using CP2 for the "next" control point
		compute_next_control_point(cpx, cpy, endx, endy); // same parameters as in the C instruction
		last_command = "S";
	};
	
	this.execute_Q = function (cpx, cpy, endx, endy) {
		svg_canvas_executor.quadraticCurveTo(cpx, cpy, endx, endy);
		compute_next_control_point(cpx, cpy, endx, endy);
		last_command = "Q";
	};
	
	this.execute_T = function (x, y) {  // use reflection point like in "S"
		init_control_point("Q", "T"); // This should help for the Charis "y"
		svg_canvas_executor.quadraticCurveTo(nextcp_x, nextcp_y, x, y);
		compute_next_control_point(nextcp_x, nextcp_y, x, y); // same parameters as in the Q instruction
		last_command = "T";
	};

	this.execute_M = function (x, y) {
		svg_canvas_executor.moveTo(x, y);
		current_x = x;
		current_y = y;
		last_command = "M";
	};

	this.execute_L = function (x, y) {
		svg_canvas_executor.lineTo(x, y);
		current_x = x;
		current_y = y;
		last_command = "L";
	};

	this.execute_V = function (y) {
		svg_canvas_executor.lineTo(current_x, y);
		current_y = y;
		last_command = "V";
	};

	this.execute_H = function (x) {
		svg_canvas_executor.lineTo(x, current_y);
		current_x = x;
		last_command = "H";
	};

	this.execute_Z = function () {
		svg_canvas_executor.closePath();
		last_command = "Z";
	};
};


// SvgPathExecutioner inherits and extends from SvgAbsolutePathExecutioner
JF.SvgPathExecutioner = function () { // TODO: Missing ARC command!

	// "Relative" SVG Path commands (lowercase versions)
	// "Relative" commands are based on the "Absolute" upper-case commands
	
	this.execute_q = function (cpx, cpy, endx, endy) {
		var current = this.get_current_point();
		var qcpx  = current.x + cpx;
		var qcpy  = current.y + cpy;
		var qendx = current.x + endx;
		var qendy = current.y + endy;
		this.execute_Q(qcpx, qcpy, qendx, qendy);
	};
	
	this.execute_t = function (x, y) {
		var current = this.get_current_point();
		var cx = current.x + x;
		var cy = current.y + y;
		this.execute_T(cx, cy);
	};

	this.execute_c = function (cpx, cpy, cp2x, cp2y, endx, endy) {
		var current = this.get_current_point();
		var ccpx  = current.x + cpx;
		var ccpy  = current.y + cpy;
		var ccp2x = current.x + cp2x;
		var ccp2y = current.y + cp2y;
		var cendx = current.x + endx;
		var cendy = current.y + endy;
		this.execute_C(ccpx, ccpy, ccp2x, ccp2y, cendx, cendy);
	};
	
	this.execute_s = function  (cpx, cpy, endx, endy) {
		var current = this.get_current_point();
		var scpx  = current.x + cpx;
		var scpy  = current.y + cpy;
		var sendx = current.x + endx;
		var sendy = current.y + endy;
		this.execute_S(scpx, scpy, sendx, sendy);
	};

	this.execute_m = function (x, y) {
		var current = this.get_current_point();
		var cx = current.x + x;
		var cy = current.y + y;
		this.execute_M(cx, cy);
		
		// Note: even in Charis, which is using relative paths, the moves are all "M".
		alert("Allelluia! We discovered an 'm' command! Congratulations!");
	};
	
	this.execute_l = function (x, y) {
		var current = this.get_current_point();
		var cx = current.x + x;
		var cy = current.y + y;
		this.execute_L(cx, cy);
	};
	
	this.execute_v = function (y) {
		var current = this.get_current_point();
		var cy = current.y + y;
		this.execute_V(cy);
	};
	
	this.execute_h = function (x) {
		var current = this.get_current_point();
		var cx = current.x + x;
		this.execute_H(cx);
	};
	
	this.execute_z = function () { // identical to Z
		this.execute_Z();
	};
};

JF.SvgPathExecutioner.prototype = new JF.SvgAbsolutePathExecutioner();

JF.PathParserHelper = function () {
	var path_data_line;
	var path_idx = -1;
	var last_cmd_idx = -1;

	this.setup_path_data = function (path) {
		path_data_line = path;
		path_idx = 0;
	};
	
	this.get_path_idx = function() {
		return path_idx;
	};

	this.more_commands = function () {
		return (path_idx >= 0 && path_idx < path_data_line.length);
	};

	this.get_next_command = function () {
		var cmd = null;

		for (var i = path_idx; i < path_data_line.length; i++) {
			if (JF.is_svg_path_command(path_data_line.charAt(i))) {
				cmd = path_data_line.charAt(i);
				last_cmd_idx = i;

				if (JF.debug.show_coordinates) {
					info("CMD: " + cmd);
				}
				path_idx = i + 1; // move cursor
				break;
			}
		}
		return cmd;
	};

	this.get_next_number = function () {
		//var n = null;

		//if (path_idx < path_data_line.length) {
			// parseInt: Failing for international fonts: Charis: coordinates with decimals: 6.5
			var n = parseFloat(path_data_line.substr(path_idx));

			// Advance the cursor: issues with decimals like in Charis's coordinates (could trim?)
			var s = '' + n;

			if (JF.debug.show_coordinates ) {
				info("Number: " + n + " @ (" + (path_idx+1) + " to " + (path_idx+1 + s.length) + ")");
			}
			path_idx = path_idx + s.length;
		//}

		return n;
	};

	this.get_next_coordinate = function () {
		var first, second, p;
		// Make sure to skip at least one whitespace (unless it's the first coordinate in the command!)
		var firstParam = (path_idx === last_cmd_idx+1);
		if (!firstParam) {
			path_idx++; 
		}
		first = this.get_next_number();

		path_idx++; // Make sure to skip at least one whitespace
		second = this.get_next_number();

		p = {
			x : first,
			y : second
		};
		if (JF.debug.show_coordinates ) {
			debug("Next coord: " + p.x + "," + p.y + " @ " + path_idx);
		}
		return p;
	};
};


JF.SvgPathParser = function() {
	var parser_helper = new JF.PathParserHelper();
	var path_executioner = new JF.SvgPathExecutioner();

	function unknown_cmd(cmd, idx) { // general error handler
		error("Unrecognized command: " + cmd + " @ " + idx);
	}

	this.parse = function(path, svg_canvas_executor) {
		if (!path) {
			return;
		}
		if (!svg_canvas_executor) {
			prog("JF.SvgPathParser: missing svg_canvas_executor");
			return;
		}
		if (JF.debug.start_glyph) {
			debug(">>>>> START GLYPH >>>>>");
		}

		var c, p, cp, cp2, path_idx;

		parser_helper.setup_path_data(path);

		path_executioner.set_svg_canvas_executor(svg_canvas_executor);

		path_executioner.begin_path(); // TODO: may want to call close_path(), stroke/fill. ?
		
		while (parser_helper.more_commands()) {
			var cmd = parser_helper.get_next_command();

			if (/[MLTmlt]/.test(cmd)) {
				p = parser_helper.get_next_coordinate();
				path_idx = parser_helper.get_path_idx();
				if (p !== null) {
					switch (cmd) {
						case 'M': path_executioner.execute_M(p.x, p.y); break;
						case 'L': path_executioner.execute_L(p.x, p.y); break;
						case 'T': path_executioner.execute_T(p.x, p.y); break;
						case 'm': path_executioner.execute_m(p.x, p.y); break;
						case 'l': path_executioner.execute_l(p.x, p.y); break;
						case 't': path_executioner.execute_t(p.x, p.y); break;
						default:  unknown_cmd(cmd, path_idx); break;
					}
				}
				else { error( cmd + ": couldn't get coordinate @ " + path_idx); }
			}
			else if (/[VHvh]/.test(cmd)) {
				c = parser_helper.get_next_number();
				path_idx = parser_helper.get_path_idx();
				if (c !== null) {
					switch (cmd) {
						case 'V': path_executioner.execute_V(c); break;
						case 'H': path_executioner.execute_H(c); break;
						case 'v': path_executioner.execute_v(c); break;
						case 'h': path_executioner.execute_h(c); break;
						default:  unknown_cmd(cmd, path_idx); break;
					}
				}
				else { error( cmd + ": couldn't get number @ " + path_idx); }
			}
			else if (/[QqSs]/.test(cmd)) {
				cp = parser_helper.get_next_coordinate();
				p = parser_helper.get_next_coordinate();
				path_idx = parser_helper.get_path_idx();

				if (cp !== null && p !== null) {
					switch (cmd) {
						case "Q": path_executioner.execute_Q(cp.x, cp.y, p.x, p.y); break;
						case "q": path_executioner.execute_q(cp.x, cp.y, p.x, p.y); break;
						case "S": path_executioner.execute_S(cp.x, cp.y, p.x, p.y); break;
						case "s": path_executioner.execute_s(cp.x, cp.y, p.x, p.y); break;
						default:  unknown_cmd(cmd, path_idx); break;
					}
				}
				else {
					error("Cannot execute Q/S: missing 4 params? @ " + path_idx);
				}
			}
			else if (/[Cc]/.test(cmd)) { // cubic bezier needs 6 parameters to get started
				cp  = parser_helper.get_next_coordinate();
				cp2 = parser_helper.get_next_coordinate();
				p   = parser_helper.get_next_coordinate();
				path_idx = parser_helper.get_path_idx();

				if (cp !== null && cp2 !== null && p !== null) {
					switch (cmd) {
						case "C": path_executioner.execute_C(cp.x, cp.y, cp2.x, cp2.y, p.x, p.y); break;
						case "c": path_executioner.execute_c(cp.x, cp.y, cp2.x, cp2.y, p.x, p.y); break;
						default:  unknown_cmd(cmd, path_idx); break;
					}
				}
				else {
					error("Cannot execute C/c: missing 6 params? @ " + path_idx);
				}
			}
			else if (/[Aa]/.test(cmd)) {
				error("Command ARC not implemented: A/a");	// TODO: add "Arc" to the parser handler!
			}
			else if (/[Zz]/.test(cmd)) {			
				path_executioner.execute_Z();

				if (JF.debug.start_glyph) {
					debug(">>>>> START GLYPH: CLOSING PATH: Z >>>>>");
				}
			}
			else {
				path_idx = parser_helper.get_path_idx();
				error("Unrecognized command: " + cmd + " @ " + path_idx);
			}
		}
	};
};
