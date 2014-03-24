// "Forked" from: P_3_2_1_01.pde at
// http://www.generative-gestaltung.de

// P_3_2_1_01.pde
// 
// Generative Gestaltung, ISBN: 978-3-87439-759-9
// First Edition, Hermann Schmidt, Mainz, 2009
// Hartmut Bohnacker, Benedikt Gross, Julia Laub, Claudius Lazzeroni
// Copyright 2009 Hartmut Bohnacker, Benedikt Gross, Julia Laub, Claudius Lazzeroni
//
// http://www.generative-gestaltung.de
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * typo outline displayed as dots and lines
 *     
 * KEYS
 * a-z                  : text input (keyboard)
 * backspace            : delete last typed letter
 * ctrl                 : save png + pdf
 */

import java.util.*;
import processing.pdf.*;
import geomerative.*;

RFont font;
String textTyped = "..";

int startTime;
int counter = 1;
int number; // this is used to store the number that gets displayed

int r1;
int r2;
int dist;

int t = 5;

PImage a;

void setup() {
  size(1324,350);  
  // make window resizable
  frame.setResizable(true); 
  smooth();
  
  a = loadImage("backgroundimage.jpeg");

  // allways initialize the library in setup
  RG.init(this);
//  font = new RFont("Courier-BoldOblique-Regular.ttf", 200, RFont.LEFT);
  font = new RFont("FreeSans.ttf", 160, RFont.LEFT);

  // get the points on the curve's shape
  // set style and segment resultion

  RCommand.setSegmentLength (11);
  RCommand.setSegmentator(RCommand.UNIFORMLENGTH);
  
  //RCommand.setSegmentAngle(random(0,HALF_PI));
  //RCommand.setSegmentator(RCommand.ADAPTATIVE);
  
  startTime = millis();
  number = 1;
  println(counter);  
}

void draw() {
  background(0);
  
  image(a, 0, 0);

  // margin border
  translate(20,220);

  if (textTyped.length() > 0) {
    // get the points on font outline
    RGroup grp;
    grp = font.toGroup(textTyped);
    grp = grp.toPolygonGroup();
    RPoint[] pnts = grp.getPoints();

    // Try different colors
    //stroke(181, 157, 0);
    //stroke(255, 255, 255);
    //stroke(0, 0, 0, 127);
//    stroke(0, 0, 0, 64);
    stroke(255, 255, 255, 64);
    strokeWeight(1.0);
    
    dist = 10;
  for (int j = 0; j < t; j++) {
    for (int i = 0; i < pnts.length-dist-1; i++ ) {
        r1 = int(random(1, dist));
        r2 = int(random(1, dist));
        line(pnts[i].x, pnts[i].y, pnts[i+1+r1].x, pnts[i+1+r2].y);
    }
  }
    
    if (false) {
      // dots
      fill(255);
      noStroke();
      for (int i = 0; i < pnts.length; i++ ) {
        float diameter = 4;
        // on ervery second point
        if (i%2 == 0) {
          ellipse(pnts[i].x, pnts[i].y, diameter, diameter);
        }
      }
    }
  }
  
     // check that a second has elapsed
    if(millis() > startTime + 1000) {
      startTime = millis(); // reset start time
      number = int(random(2,6)); // generate a new number
      
      counter ++; // add to the counter
      println(counter);
    }
}


void keyPressed() {
  // println(keyCode+" -> "+key);
  if (key != CODED) {
    switch(key) {
    case DELETE:
    case BACKSPACE:
      textTyped = textTyped.substring(0,max(0,textTyped.length()-1));
      break;
    case TAB:   
    case ENTER:
    case RETURN:
    case ESC:
      break;
    default:
      textTyped += key;
    }
  }
}

// timestamp
String timestamp() {
  Calendar now = Calendar.getInstance();
  return String.format("%1$ty%1$tm%1$td_%1$tH%1$tM%1$tS", now);
}






