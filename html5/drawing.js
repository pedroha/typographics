// requestAnim: TOO FAST!
//
// requestAnim shim layer by Paul Irish
//
// window.requestAnimFrame = (function(){
//   return  window.requestAnimationFrame       || 
//           window.webkitRequestAnimationFrame || 
//           window.mozRequestAnimationFrame    || 
//           window.oRequestAnimationFrame      || 
//           window.msRequestAnimationFrame     || 
//           function(/* function */ callback, /* DOMElement */ element){
//             window.setTimeout(callback, 1000 / 60);
//           };
// })();
//------

"use strict";

;(function(state) {

var originalVertices = true;
var complementaryNoise = true;

var canvas = document.getElementById("canvas");
var c = canvas.getContext("2d");

//http://www.robertpenner.com/easing_terms_of_use.html

// Note: For a single letter, this will do
// c.translate(0, H); // ascent /// Just the "ascent" needs to be translated
// c.scale(1, -1);

var H = 800;  // height of a letter

state.xx = H; // 'state' must be defined!

c.translate(0, H);
c.scale(0.5, -0.5);

var A = "M527 17Q497 34 473 93Q435 184 374 411Q357 471 347 509T332 563Q322 599 316 630T304 687L294 692Q257 655 186 634L182 623Q190 610 195 601T202 583Q191 542 187 532L118 296Q106 254 91 209T57 116Q31 48 -2 15L1 1Q33 8 70 8Q108 8 148 0L153 20Q95 36 95 94Q95 153 122 219Q153 241 218 241Q268 241 313 226Q344 123 344 87Q344 43 294 17L298 0Q329 7 358 10T414 13Q467 13 523 1L527 17ZM302 261Q277 265 257 267T223 269Q171 269 131 254Q189 444 218 539Q226 519 235 492T255 427L302 261Z";

var G = "M474 -46Q471 48 471 82V152V170Q470 177 470 182Q470 188 470 193V222L457 231Q430 225 385 225Q375 225 357 226T309 229Q296 230 290 230T284 231V211H294Q339 205 354 176Q364 157 364 102Q364 47 307 47Q212 47 163 170Q125 266 125 371Q125 465 158 542Q201 642 286 642Q324 642 324 612Q324 610 323 606T320 595T317 584T315 575Q315 554 332 539T371 524Q399 524 418 542T437 589Q437 631 395 655Q360 675 315 675Q186 675 97 538Q18 417 18 281Q18 161 72 85Q133 -2 247 -2Q296 -2 352 22Q385 37 401 37Q445 37 458 -48L474 -46Z";

var C = "M446 152Q446 175 426 175Q410 175 409 147Q409 124 400 105T376 71T340 48T297 39Q241 39 195 100Q124 195 124 367Q124 458 157 536Q200 639 279 639Q324 639 324 612Q324 607 321 597Q315 577 315 565Q315 545 332 531T372 517Q399 517 416 535T434 581Q434 624 395 648Q362 669 316 669Q185 669 96 532Q19 411 19 272Q19 156 72 79Q132 -9 243 -9Q343 -9 404 64Q446 115 446 152Z";

var T = "M505 685L488 689Q465 669 449 663Q442 661 431 660T402 658L254 655Q204 654 179 654T152 653Q88 653 69 661Q57 666 49 687H30Q20 584 -3 500H16Q45 571 81 600Q117 630 191 632V341L187 185Q186 149 186 131T185 111Q182 70 173 54Q160 30 126 17L132 0Q178 13 248 13Q309 13 360 0L366 21Q301 39 303 153Q304 198 304 226Q304 254 305 268Q306 285 306 292Q306 299 306 295V232V632Q386 631 416 610Q451 584 451 508V500H470Q474 542 482 588T505 685Z";

var canvasDrawer = new JF.PolyLineSegmentorSvgCanvasExecutor(10, 30);
var parser = new JF.SvgPathParser();

canvasDrawer.group('A'); parser.parse(A, canvasDrawer); 
canvasDrawer.group('T'); parser.parse(T, canvasDrawer); 
canvasDrawer.group('C'); parser.parse(C, canvasDrawer); 
canvasDrawer.group('G'); parser.parse(G, canvasDrawer);

c.fillStyle = "white";
c.lineWidth = 20;
c.lineCap = "round";
c.lineJoin = "round";
c.stroke();
c.fill();

if (typeof canvasDrawer.getPolyLines === "function") {

	c.strokeStyle = "#cf7";
	// c.fillStyle = "#cf7";

	var drawOutlines = function(color, intensity, richness, noise) {

		c.lineWidth = intensity;

		var xMaxNoise = noise;
		var yMaxNoise = noise;

		var line = function(c, x, y, toX, toY) {
			c.beginPath();
			if (1) {
				x = x + (Math.random()-0.5) * xMaxNoise;
				y = y + (Math.random()-0.5) * yMaxNoise;
				toX = toX + (Math.random()-0.5) * xMaxNoise;
				toY = toY + (Math.random()-0.5) * yMaxNoise;					
			}
			c.moveTo(x, y);
			c.lineTo(toX, toY);
			c.stroke();
		};

		var xx = state.xx;

		var margin = 20;
    	canvasDrawer.translate('A', margin + H-xx, H + 100 - margin);
    	canvasDrawer.translate('T', margin + xx, H + 100 - margin);
    	canvasDrawer.translate('C', margin + H-xx, 100 - margin);
    	canvasDrawer.translate('G', margin + xx, 100 - margin);

    	var polylines = canvasDrawer.getPolyLines();

		c.fillStyle = "black";
		c.fillRect(0, 0, H * 2, H * 2);

		var maxLength = 0;

		if (originalVertices) {
			for (var j = 0; j < polylines.length; j++) {
				var polyline = polylines[j];
				var endpoints = polyline.get();

				var p = endpoints[0];

				c.strokeStyle = color;
				for (var i = 1; i < endpoints.length; i++) {
					var n = endpoints[i];
					line(c, p.x, p.y, n.x, n.y);
					p = n;
				}
				maxLength = Math.max(maxLength, endpoints.length);
			}
		}

		if (complementaryNoise) {
			var dist = richness;

			for (var j = 0; j < polylines.length; j++) {
				var polyline = polylines[j];
				var endpoints = polyline.get();
				var r1 = Math.floor(Math.random() * dist);
				var r2 = Math.floor(Math.random() * dist);

 				c.strokeStyle = color;
				for (var i = 0; i < endpoints.length-dist-1; i++) {
					line(c, endpoints[i].x, endpoints[i].y, endpoints[i+1+r1].x, endpoints[i+1+r2].y);
				}
				maxLength = Math.max(maxLength, endpoints.length);
			}
		}
	}

	var forward = true;
	var iter = 0;

	window.requestAnimFrame = function(callback) {
		var s = speed.value;
        window.setTimeout(callback, s);
    };

	var draw = function() {
		requestAnimFrame(draw);

		var color = (iter%2) ? '#aaa': '#ccc';
		drawOutlines(color, state.intensity, state.richness, state.noise);
		iter++;

		if (forward)
			state.xx -= 8;
		else
			state.xx += 8;

		if (state.xx < 0) {
			forward = false;
			state.xx = 0;
		}
		if (state.xx > H) {
			forward = true;
			state.xx = H;
		}
	}

	draw();
}

})(window.state);
