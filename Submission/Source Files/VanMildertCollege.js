// MultiJointModel.js (c) 2012 matsuda and itami
// Vertex shader program

var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoords;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +    // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +   // Transformation matrix of the normal
  'varying vec4 v_Color;\n' +
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
	'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Calculate the vertex position in the world coordinate
  '  v_Position = vec3(u_ModelMatrix * a_Position);\n' +
  '  v_Normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  v_Color = a_Color;\n' + 
	'  v_TexCoords = a_TexCoords;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform vec3 u_LightColor;\n' +     // Light color
  'uniform vec3 u_LightPosition;\n' +  // Position of the light source
  'uniform vec3 u_AmbientLight;\n' +   // Ambient light color
  'varying vec3 v_Normal;\n' +
  'varying vec3 v_Position;\n' +
  'varying vec4 v_Color;\n' +
	'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoords;\n' +
  'void main() {\n' +
     // Normalize the normal because it is interpolated and not 1.0 in length any more
  '  vec3 normal = normalize(v_Normal);\n' +
     // Calculate the light direction and make its length 1.
  '  vec3 lightDirection = normalize(u_LightPosition - v_Position);\n' +
     // The dot product of the light direction and the orientation of a surface (the normal)
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
     // Calculate the final color from diffuse reflection and ambient reflection
  '  vec3 diffuse;\n' +
  '  vec4 TexColor = texture2D(u_Sampler, v_TexCoords);\n' +
  '  diffuse = u_LightColor * v_Color.rgb * TexColor.rgb * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight * v_Color.rgb;\n' +
  '  gl_FragColor = vec4(diffuse + ambient, v_Color.a);\n' +
  '}\n';

var STARTPOSITION = [0.0, 40.0, 250.0];

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the vertex information
  var n = initVertexBuffers(gl);
  if (n < 0) {
    console.log('Failed to set the vertex information');
    return;
  }

  // Set the sky color and enable the depth test
  gl.clearColor(0.0, 1.0, 1.0, 0.8);
  gl.enable(gl.DEPTH_TEST);

  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix');
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor');
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition');
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight');
  if (!u_MvpMatrix || !u_NormalMatrix || !u_LightColor || !u_LightPosition　|| !u_AmbientLight) { 
    console.log('Failed to get the storage location');
    return;
  }

  // Calculate the view projection matrix
  var viewProjMatrix = new Matrix4();
  viewProjMatrix.setPerspective(60.0, canvas.width / canvas.height, 1.0, 800.0);
  viewProjMatrix.lookAt(0.0, STARTPOSITION[1], 200.0, 0.0, STARTPOSITION[1], -500.0, 0.0, 1.0, 0.0);
	
	var multiplier = 2;
	var starterValue = 40;
  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, (150 + 105*(Math.sin(toRadians(starterValue*multiplier))))/255, (30 + 225*(Math.sin(toRadians(starterValue*multiplier))))/255);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 250*(Math.cos(toRadians(starterValue*multiplier))), 40 + 210*(Math.sin(toRadians(starterValue*multiplier))), 20 + 230*(Math.sin(toRadians(starterValue*multiplier))));
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.35, 0.35, 0.35);
	
	var sliderFunc = function changeLighting(){	
		// Set the light color (white)
		var lightColor = [255/255, (150 + 105*(Math.sin(toRadians(slider.value*multiplier))))/255, (30 + 225*(Math.sin(toRadians(slider.value*multiplier))))/255];
		gl.uniform3f(u_LightColor, lightColor[0], lightColor[1], lightColor[2]);
		
		// Set the light direction (in the world coordinate)
		var lightPosition = [250*(Math.cos(toRadians(slider.value*multiplier))), 40 + 210*(Math.sin(toRadians(slider.value*multiplier))), 20 + 230*(Math.sin(toRadians(slider.value*multiplier)))];
		gl.uniform3f(u_LightPosition, lightPosition[0], lightPosition[1], lightPosition[2]);
		
		// Set the ambient light
		gl.uniform3f(u_AmbientLight, 0.3, 0.3, 0.3);
	}
	
	var slider = document.getElementById("slider");
	slider.addEventListener("input", sliderFunc);

  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); };
	if( typeof keydown.rotation == 'undefined' ) {
    keydown.rotation = [0.0, 0.0];
  }
	if( typeof keydown.position == 'undefined' ) {
    keydown.position = STARTPOSITION;
  }
	
	canvas.onclick = function() {
		canvas.requestPointerLock();
	}
	
	document.addEventListener('pointerlockchange', lockChangeAlert, false);
	document.addEventListener('mozpointerlockchange', lockChangeAlert, false);
	
	var mouseMoveX = function(movementX){
		viewProjMatrix.translate(keydown.position[0], keydown.position[1], keydown.position[2]);
		viewProjMatrix.rotate(movementX, 0.0, 1.0, 0.0);
		viewProjMatrix.translate(-keydown.position[0], -keydown.position[1], -keydown.position[2]);
		
		keydown.rotation[1] += movementX;
	}
	
	var mouseMoveY = function(movementY){
		viewProjMatrix.translate(keydown.position[0], keydown.position[1], keydown.position[2]);
		viewProjMatrix.rotate(keydown.rotation[1], 0.0,-1.0, 0.0)
		viewProjMatrix.rotate(movementY, 1.0, 0.0, 0.0);
		viewProjMatrix.rotate(keydown.rotation[1], 0.0, 1.0, 0.0)
		viewProjMatrix.translate(-keydown.position[0], -keydown.position[1], -keydown.position[2]);
		
		keydown.rotation[0] += movementY;
	}
	
	var mouseMoveFunc = function(ev){
		//console.log(ev.movementX, ev.movementY);
		if(ev.movementX !=  0){ //Moving in X axis
			mouseMoveX(ev.movementX);
		}
		else if(ev.movementY !=  0){
			mouseMoveY(ev.movementY);
		}
	}
	
	function lockChangeAlert() {
		if (document.pointerLockElement === canvas || document.mozPointerLockElement === canvas) {
			//console.log('The pointer lock status is now locked');
			canvas.addEventListener("mousemove", mouseMoveFunc, false);
		}
		else {
			//console.log('The pointer lock status is now unlocked');
			canvas.removeEventListener("mousemove", mouseMoveFunc);
		}
	}
	
	draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	var mover = setInterval( function() { moveModels(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); }
	, 1000/60);
}

var angleStep = 2.0;     // The increments of rotation angle (degrees)

var fastCounter = 0;
var slowCounter = 0;
function moveModels(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix){
	
	fastCounter += 1;
	if (fastCounter % 360 == 0) {fastCounter = 0;}
	
	slowCounter += 0.5;
	if (slowCounter % 360 == 0) {slowCounter = 0;}
	
	draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function toRadians (angle) {
  return (angle/ 180) * Math.PI;
}

//keydown.rotation = [0.0, 0.0];
//keydown.position = [0.0, STARTPOSITION[1], 200.0];
function keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {	
  switch (ev.keyCode) {
    case 16: // Shift key
      if (keydown.position[1] < 200.0) {
				viewProjMatrix.translate(0.0, -5.0, 0.0)
				keydown.position[1] += 5.0
			}
      break;
    case 17: // Ctrl key
      if (keydown.position[1] > 15.0) {
				viewProjMatrix.translate(0.0, 5.0, 0.0)
				keydown.position[1] -= 5.0
			}
      break;
		case 38: // Up arrow key
			viewProjMatrix.translate(keydown.position[0], keydown.position[1], keydown.position[2])
			viewProjMatrix.rotate(keydown.rotation[1], 0.0, -1.0, 0.0)
      viewProjMatrix.rotate(angleStep, -1.0, 0.0, 0.0)
			viewProjMatrix.rotate(keydown.rotation[1], 0.0, 1.0, 0.0)
			viewProjMatrix.translate(-keydown.position[0], -keydown.position[1], -keydown.position[2])
			
			keydown.rotation[0] += angleStep
      break;
    case 40: // Down arrow key
      viewProjMatrix.translate(keydown.position[0], keydown.position[1], keydown.position[2])
			viewProjMatrix.rotate(keydown.rotation[1], 0.0, -1.0, 0.0)
      viewProjMatrix.rotate(angleStep, 1.0, 0.0, 0.0)
			viewProjMatrix.rotate(keydown.rotation[1], 0.0, 1.0, 0.0)
			viewProjMatrix.translate(-keydown.position[0], -keydown.position[1], -keydown.position[2])
			
			keydown.rotation[0] += angleStep
      break;	
		case 39: // Right arrow key
			viewProjMatrix.translate(keydown.position[0], keydown.position[1], keydown.position[2])
      viewProjMatrix.rotate(angleStep, 0.0, 1.0, 0.0)
			viewProjMatrix.translate(-keydown.position[0], -keydown.position[1], -keydown.position[2])
			
			keydown.rotation[1] += angleStep
      break;
    case 37: // Left arrow key
      viewProjMatrix.translate(keydown.position[0], keydown.position[1], keydown.position[2])
      viewProjMatrix.rotate(angleStep, 0.0, -1.0, 0.0)
			viewProjMatrix.translate(-keydown.position[0], -keydown.position[1], -keydown.position[2])
			
			keydown.rotation[1] -= angleStep
      break;
		case 87: // W key
			var xChange = -5.0 * Math.sin(toRadians(keydown.rotation[1]));
			var zChange = 5.0 * Math.cos(toRadians(keydown.rotation[1]))
      viewProjMatrix.translate(xChange, 0.0, zChange)
			keydown.position[0] -= xChange
			keydown.position[2] -= zChange
      break;
    case 68: // D key
			var xChange = -5.0 * Math.cos(toRadians(keydown.rotation[1]));
			var zChange = -5.0 * Math.sin(toRadians(keydown.rotation[1]))
      viewProjMatrix.translate(xChange, 0.0, zChange)
			keydown.position[0] -= xChange
			keydown.position[2] -= zChange
      break;
		case 83: // S key
			var xChange = 5.0 * Math.sin(toRadians(keydown.rotation[1]));
			var zChange = -5.0 * Math.cos(toRadians(keydown.rotation[1]))
      viewProjMatrix.translate(xChange, 0.0, zChange)
			keydown.position[0] -= xChange
			keydown.position[2] -= zChange
      break;
		case 65: // A key
			var xChange = 5.0 * Math.cos(toRadians(keydown.rotation[1]));
			var zChange = 5.0 * Math.sin(toRadians(keydown.rotation[1]))
      viewProjMatrix.translate(xChange, 0.0, zChange)
			keydown.position[0] -= xChange
			keydown.position[2] -= zChange
      break;
    default: return; // Skip drawing at no effective action
  }
  draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function initVertexBuffers(gl) {

  var vertices = new Float32Array([
    0.5, 1.0, 0.5, -0.5, 1.0, 0.5, -0.5, 0.0, 0.5,  0.5, 0.0, 0.5, // v0-v1-v2-v3 front
    0.5, 1.0, 0.5,  0.5, 0.0, 0.5,  0.5, 0.0,-0.5,  0.5, 1.0,-0.5, // v0-v3-v4-v5 right
    0.5, 1.0, 0.5,  0.5, 1.0,-0.5, -0.5, 1.0,-0.5, -0.5, 1.0, 0.5, // v0-v5-v6-v1 up
   -0.5, 1.0, 0.5, -0.5, 1.0,-0.5, -0.5, 0.0,-0.5, -0.5, 0.0, 0.5, // v1-v6-v7-v2 left
   -0.5, 0.0,-0.5,  0.5, 0.0,-0.5,  0.5, 0.0, 0.5, -0.5, 0.0, 0.5, // v7-v4-v3-v2 down
    0.5, 0.0,-0.5, -0.5, 0.0,-0.5, -0.5, 1.0,-0.5,  0.5, 1.0,-0.5  // v4-v7-v6-v5 back
  ]);

  // Normal
  var normals = new Float32Array([
    0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0,  0.0, 0.0, 1.0, // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0,  1.0, 0.0, 0.0, // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0,  0.0, 1.0, 0.0, // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0,  0.0,-1.0, 0.0, // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0,  0.0, 0.0,-1.0  // v4-v7-v6-v5 back
  ]);
	
	// Texture Coordinates
	var texCoords = new Float32Array([
	1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v0-v1-v2-v3 front
	0.0, 1.0,    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,  // v0-v3-v4-v5 right
	1.0, 0.0,    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,  // v0-v5-v6-v1 up
	1.0, 1.0,    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,  // v1-v6-v7-v2 left
	0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,  // v7-v4-v3-v2 down
	0.0, 0.0,    1.0, 0.0,   1.0, 1.0,   0.0, 1.0   // v4-v7-v6-v5 backa
	]);

  // Indices of the vertices
  var indices = new Uint8Array([
     0, 1, 2,   0, 2, 3,    // front
     4, 5, 6,   4, 6, 7,    // right
     8, 9,10,   8,10,11,    // up
    12,13,14,  12,14,15,    // left
    16,17,18,  16,18,19,    // down
    20,21,22,  20,22,23     // back
  ]);

  // Write the vertex property to buffers (coordinates and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, gl.FLOAT, 3)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, gl.FLOAT, 3)) return -1;
	if (!initArrayBuffer(gl, 'a_TexCoords', texCoords, gl.FLOAT, 2)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4();

function draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	var LQ = document.getElementById("LQ").checked;

	drawLeftBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	drawRightBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	drawBottomBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	drawBuilding(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	drawWater(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	drawDuck(gl, n, false, -110.0, 3.0, 30.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	if(!LQ){ drawDuck(gl, n, true, -50.0, 3.0, 30.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);};
	
	drawFlyingDuck(gl, n, 0.0, 110.0, 0.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	if(!LQ){ drawFlyingDuck(gl, n, 20.0, 110.0, 20.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);};
	
	drawSwan(gl, n, -80.0, 0.0, 90.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	if(!LQ){ drawBushelOfReeds(gl, n,  0.0, 6.0, 4.0, 4.0, 2.2, 90.0,  5.0, 50.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);};
	if(!LQ){ drawBushelOfReeds(gl, n, 30.0, 6.0, 4.0, 4.5, 2.2, 100.0, 5.0, 38.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);};
					 drawBushelOfReeds(gl, n, 15.0, 6.0, 4.0, 5.0, 2.2, 100.0, 5.0, 50.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	if(!LQ){ drawBushelOfReeds(gl, n,  0.0, 6.0, 4.0, 4.5, 2.2, 100.0, 5.0, 62.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);};
	
	drawFountain(gl, n, 130.0, 5.0, 120.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function drawLeftBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(-200.0, 0.0, 50.0);
	drawBox(gl, n, 30.0, 10, 300.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
	
	g_modelMatrix.translate(17.5, 2.5, 0.0);
	g_modelMatrix.rotate(45, 0.0, 0.0, 1.0);
	drawBox(gl, n, Math.sqrt(50), Math.sqrt(50), 300.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
}

function drawRightBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(200.0, 0.0, 50.0);
	drawBox(gl, n, 30.0, 10, 300.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
	
	g_modelMatrix.translate(-12.5, 2.5, 0.0);
	g_modelMatrix.rotate(45, 0.0, 0.0, 1.0);
	drawBox(gl, n, Math.sqrt(50), Math.sqrt(50), 300.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
}

function drawBottomBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(0.0, 0.0, 200.0);
	drawBox(gl, n, 430.0, 10, 30.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
	
	g_modelMatrix.translate(0.0, 2.5, -17.5);
	g_modelMatrix.rotate(45, 1.0, 0.0, 0.0);
	drawBox(gl, n, 430.0, Math.sqrt(50), Math.sqrt(50), viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
}

function drawBuilding(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	
	// Big box
	g_modelMatrix.setTranslate(0.0, 50.0, -150.0);
	drawBox(gl, n, 430.0, 160, 100.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Left Leg
	g_modelMatrix.translate(-205.0, -50.0, 40.0);
	drawBox(gl, n, 20.0, 50, 20.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Right Leg
	g_modelMatrix.translate(410.0, 0.0, 0.0);
	drawBox(gl, n, 20.0, 50, 20.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Floor
	g_modelMatrix.translate(-205.0, 0.0, -40.0);
	drawBox(gl, n, 430.0, 10.0, 100.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		160/255,135/255,110/255, 160/255,135/255,110/255, 160/255,135/255,110/255, 160/255,135/255,110/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Gym block
	g_modelMatrix.translate(0.0, 0.0, -30.0);
	drawBox(gl, n, 430.0, 50.0, 40.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		200/255,165/255,120/255, 200/255,165/255,120/255, 200/255,165/255,120/255, 200/255,165/255,120/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Centred from floor up
	g_modelMatrix.translate(0.0, 0.0, 82.5);
	
	pushMatrix(g_modelMatrix);
		drawOuting(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	g_modelMatrix = popMatrix();
	
	// Right Railings
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(50.0, 0.0, -2.0);
		drawRailings(gl, n, 48.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	g_modelMatrix = popMatrix();
	
	// Left Railings
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(-70.0, 0.0, -2.0);
		drawRailings(gl, n, 48.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	g_modelMatrix = popMatrix();
	
	// Right Right Railings
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(166.5, 0.0, -2.0);
		drawRailings(gl, n, 42.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	g_modelMatrix = popMatrix();
	
	// Left Left Railings
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(-186.5, 0.0, -2.0);
		drawRailings(gl, n, 42.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	g_modelMatrix = popMatrix();
	
	g_modelMatrix.translate(-120.0, 0.0, 0.0);
	pushMatrix(g_modelMatrix);
	drawOuting(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	g_modelMatrix = popMatrix();
	
	g_modelMatrix.translate(240, 0.0, 0.0);
	pushMatrix(g_modelMatrix);
	drawOuting(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	g_modelMatrix = popMatrix();
}

function drawRailings(gl, n, width, viewProjMatrix, u_MvpMatrix, u_NormalMatrix){
	// Top bar
		g_modelMatrix.translate(10.0, 30.0, -2.0);
			drawBox(gl, n, width, 2.0, 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v1-v2-v3 front
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v3-v4-v5 right
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v5-v6-v1 up
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v1-v6-v7-v2 left
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v7-v4-v3-v2 down
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255　  // v4-v7-v6-v5 back
		]), null);
		
		// Center bar
		g_modelMatrix.translate(0.0, -20.0, 0.0);
			drawBox(gl, n, 3.0, 20.0, 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v1-v2-v3 front
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v3-v4-v5 right
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v5-v6-v1 up
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v1-v6-v7-v2 left
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v7-v4-v3-v2 down
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255　  // v4-v7-v6-v5 back
		]), null);
		
		// Left bar
		g_modelMatrix.translate(-13.0, 0.0, 0.0);
			drawBox(gl, n, 3.0, 20.0, 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v1-v2-v3 front
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v3-v4-v5 right
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v5-v6-v1 up
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v1-v6-v7-v2 left
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v7-v4-v3-v2 down
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255　  // v4-v7-v6-v5 back
		]), null);
		
		// Left bar
		g_modelMatrix.translate(26.5, 0.0, 0.0);
			drawBox(gl, n, 3.0, 20.0, 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v1-v2-v3 front
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v3-v4-v5 right
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v0-v5-v6-v1 up
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v1-v6-v7-v2 left
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255,  // v7-v4-v3-v2 down
			10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255, 10/255,90/255,60/255　  // v4-v7-v6-v5 back
		]), null);
}

function drawOuting(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	
	// Window Panel
	g_modelMatrix.translate(-10.0, 0.0, 20.0);
	pushMatrix(g_modelMatrix);
		// Window Frame
		g_modelMatrix.translate(0.0, 50.0, -0.6);
		drawBox(gl, n, 20.0, 160.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v1-v2-v3 front
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v3-v4-v5 right
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v5-v6-v1 up
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v1-v6-v7-v2 left
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v7-v4-v3-v2 down
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255  // v4-v7-v6-v5 back
		]), null);
		
		// Window Panes
		g_modelMatrix.translate(10.0, 142.0, 0.1);
		drawBox(gl, n, 36.0, 16.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
		
		g_modelMatrix.translate(-10.0, -40.0, 0.0);
		drawBox(gl, n, 16.0, 36.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
		
		g_modelMatrix.translate(0.0, -40.0, 0.0);
		drawBox(gl, n, 16.0, 36.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
		
		g_modelMatrix.translate(0.0, -40.0, 0.0);
		drawBox(gl, n, 16.0, 36.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
		
		g_modelMatrix.translate(10.0, -20.0, 0.0);
		drawBox(gl, n, 36.0, 16.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Window Panel
	pushMatrix(g_modelMatrix);
		// Window Frame
		g_modelMatrix.translate(20.0, 50.0, -0.6);
		drawBox(gl, n, 20.0, 160.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v1-v2-v3 front
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v3-v4-v5 right
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v5-v6-v1 up
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v1-v6-v7-v2 left
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v7-v4-v3-v2 down
			255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255  // v4-v7-v6-v5 back
		]), null);
		
		// Window Panes
		g_modelMatrix.translate(0.0, 142.0, 0.1);
		drawBox(gl, n, 16.0, 16.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
		
		g_modelMatrix.translate(0.0, -40.0, 0.0);
		drawBox(gl, n, 16.0, 36.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
		
		g_modelMatrix.translate(0.0, -40.0, 0.0);
		drawBox(gl, n, 16.0, 36.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
		
		g_modelMatrix.translate(0.0, -40.0, 0.0);
		drawBox(gl, n, 16.0, 36.0, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v1-v2-v3 front
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v3-v4-v5 right
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v0-v5-v6-v1 up
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v1-v6-v7-v2 left
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255,  // v7-v4-v3-v2 down
		20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255, 20/255,80/255,120/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Hiding empty space in window
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(10.0, 50.0, -12.0);
		drawBox(gl, n, 40.0, 10.0, 22, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	g_modelMatrix = popMatrix();
	
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(25.0, 50.0, -22.0);
		g_modelMatrix.rotate(60, 0.0, 1.0, 0.0);
		drawBox(gl, n, 30.0, 10.0, 30, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	g_modelMatrix = popMatrix();
	
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(-5.0, 50.0, -22.0);
		g_modelMatrix.rotate(60, 0.0, -1.0, 0.0);
		drawBox(gl, n, 30.0, 10.0, 30, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	g_modelMatrix = popMatrix();
	
	// Floor in window
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(10.0, 0.0, -12.0);
		drawBox(gl, n, 40.0, 10.0, 22, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		160/255,135/255,110/255, 160/255,135/255,110/255, 160/255,135/255,110/255, 160/255,135/255,110/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	g_modelMatrix = popMatrix();
	
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(25.0, 0.0, -22.0);
		g_modelMatrix.rotate(60, 0.0, 1.0, 0.0);
		drawBox(gl, n, 30.0, 10.0, 30, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		160/255,135/255,110/255, 160/255,135/255,110/255, 160/255,135/255,110/255, 160/255,135/255,110/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	g_modelMatrix = popMatrix();
	
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(-5.0, 0.0, -22.0);
		g_modelMatrix.rotate(60, 0.0, -1.0, 0.0);
		drawBox(gl, n, 30.0, 10.0, 30, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v1-v2-v3 front
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v0-v3-v4-v5 right
		160/255,135/255,110/255, 160/255,135/255,110/255, 160/255,135/255,110/255, 160/255,135/255,110/255,  // v0-v5-v6-v1 up
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v1-v6-v7-v2 left
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255,  // v7-v4-v3-v2 down
		215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255, 215/255,185/255,125/255　  // v4-v7-v6-v5 back
	]), null);
	g_modelMatrix = popMatrix();
	
	// Railings
	pushMatrix(g_modelMatrix);
		drawRailings(gl, n, 48.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	g_modelMatrix = popMatrix();
	
	
	// Grey Diagonals
	g_modelMatrix.translate(20.0, 0.0, -12.0);
	
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(19.0, 0.0, 0.0);
		g_modelMatrix.rotate(60, 0.0, 1.0, 0.0);
		drawBox(gl, n, 30.0, 230.0, 5.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v1-v2-v3 front
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v3-v4-v5 right
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v5-v6-v1 up
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v1-v6-v7-v2 left
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v7-v4-v3-v2 down
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	pushMatrix(g_modelMatrix);		
		g_modelMatrix.translate(-39.0, 0.0, 0.0);
		g_modelMatrix.rotate(60, 0.0, -1.0, 0.0);
		drawBox(gl, n, 30.0, 230.0, 5.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v1-v2-v3 front
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v3-v4-v5 right
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v5-v6-v1 up
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v1-v6-v7-v2 left
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v7-v4-v3-v2 down
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
}

function drawWater(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(0.0, 0.0, 50.0);
	drawBox(gl, n, 400.0, 5, 300.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v0-v1-v2-v3 front
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v0-v3-v4-v5 right
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v0-v5-v6-v1 up
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v1-v6-v7-v2 left
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v7-v4-v3-v2 down
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255　  // v4-v7-v6-v5 back
	]), "water");
}

function drawDuck(gl, n, reverse, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	//// Draw a Duck
	// Draw Body
	
	var wingMulitplier = 10;
	
	if (!reverse) {
		g_modelMatrix.setTranslate(10 * Math.cos(toRadians(fastCounter)) + x, y, 10 * Math.sin(toRadians(fastCounter)) + z);
		g_modelMatrix.rotate(fastCounter, 0.0, -1.0, 0.0);
	}
	else {
		g_modelMatrix.setTranslate(-10 * Math.cos(toRadians(fastCounter)) + x, y, 10 * Math.sin(toRadians(fastCounter)) + z);
		g_modelMatrix.rotate(fastCounter, 0.0, 1.0, 0.0);
	}
	
	g_modelMatrix.translate(0.0, 3.0, 0.0);
  drawBox(gl, n, 6.0, 6.0, 8.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		 84/255, 33/255,  7/255,  84/255, 33/255,  7/255, 40/255,  15/255,  4/255, 40/255,  15/255,  4/255,  // v0-v1-v2-v3 front
		100/255,100/255,100/255, 100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255,  // v0-v3-v4-v5 right
		100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
		100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v1-v6-v7-v2 left
		204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v7-v4-v3-v2 down
		100/255,100/255,100/255, 100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255　  // v4-v7-v6-v5 back
	]), null);
	
	drawBox(gl, n, 6.0, 6.0, 8.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v0-v1-v2-v3 front
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v0-v3-v4-v5 right
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v1-v6-v7-v2 left
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v7-v4-v3-v2 down
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255　  // v4-v7-v6-v5 back
	]), null);

	// Draw Head
		g_modelMatrix.translate(0.0, 5.0, 4.5);
		drawBox(gl, n, 4.0, 5.0, 3.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		40/255, 100/255, 40/255, 40/255, 100/255,  40/255, 20/255,  50/255,  20/255, 20/255,  50/255,  20/255,  // v0-v1-v2-v3 front
		40/255, 100/255, 40/255, 20/255,  50/255,  20/255, 40/255, 100/255,  40/255, 100/255,  50/255, 200/255,  // v0-v3-v4-v5 right
		40/255, 100/255, 40/255, 100/255,  50/255, 200/255, 100/255,  50/255, 200/255, 40/255, 100/255,  40/255,  // v0-v5-v6-v1 up
		40/255, 100/255, 40/255, 100/255,  50/255, 200/255, 40/255, 100/255,  40/255, 20/255,  50/255,  20/255,  // v1-v6-v7-v2 left
		40/255, 100/255, 40/255, 40/255, 100/255,  40/255, 20/255,  50/255,  20/255, 20/255,  50/255,  20/255,  // v7-v4-v3-v2 down
		40/255, 100/255, 40/255, 40/255, 100/255,  40/255, 100/255,  50/255, 200/255, 50/255,  30/255, 160/255　  // v4-v7-v6-v5 back
		]), null);
  
		// Draw Beak
		g_modelMatrix.translate(0.0, 1.0, 2.5);
		drawBox(gl, n, 3.0, 2.0, 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		225/255,185/255, 50/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255,  // v0-v1-v2-v3 front
		225/255,185/255, 50/255, 225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255,  // v0-v3-v4-v5 right
		225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255,  // v0-v5-v6-v1 up
		225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255,  // v1-v6-v7-v2 left
		200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255,  // v7-v4-v3-v2 down
		200/255,130/255, 40/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255,   // v4-v7-v6-v5 back
		]), null);
	
		// Draw Right Eye
		g_modelMatrix.translate(1.0, 2.5, -1.0);
		drawBox(gl, n, 0.8, 0.8, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v1-v2-v3 front
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v3-v4-v5 right
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v5-v6-v1 up
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v1-v6-v7-v2 left
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v7-v4-v3-v2 down
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255　  // v4-v7-v6-v5 back
		]), null);
	
		// Draw Left Eye
		g_modelMatrix.translate(-2.0, 0.0, 0.0);
		drawBox(gl, n, 0.8, 0.8, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v1-v2-v3 front
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v3-v4-v5 right
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v5-v6-v1 up
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v1-v6-v7-v2 left
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v7-v4-v3-v2 down
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255　  // v4-v7-v6-v5 back
		]), null);
	
	// Draw Right Wing
	g_modelMatrix.translate(4.5, -6.5, -6.0);
	pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(180, 0.0, 0.0, 1.0);
		g_modelMatrix.translate(0.0, -4.0, 0.0);
		
		g_modelMatrix.rotate(35, 0.0, 0.0, 1.0);
		
		g_modelMatrix.rotate(30*Math.sin(toRadians(wingMulitplier*fastCounter)), 0.0, 0.0, 1.0);
		
		drawBox(gl, n, 1.0, 4.0, 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			100/255,100/255,100/255, 100/255,100/255,100/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v0-v1-v2-v3 front
			100/255,100/255,100/255,  50/255, 50/255, 50/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255,  // v0-v3-v4-v5 right
			100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
			100/255,100/255,100/255, 204/255,204/255,204/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  // v1-v6-v7-v2 left
			 35/255, 35/255, 35/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v7-v4-v3-v2 down
			 35/255, 35/255, 35/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255, 204/255,204/255,204/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Draw Left Wing
	g_modelMatrix.translate(-7.0, 0.0, 0.0);
	pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(180, 0.0, 0.0, 1.0);
		g_modelMatrix.translate(0.0, -4.0, 0.0);
		
		g_modelMatrix.rotate(-35, 0.0, 0.0, 1.0);
		
		g_modelMatrix.rotate(30*Math.sin(toRadians(wingMulitplier*fastCounter)), 0.0, 0.0, -1.0);
		drawBox(gl, n, 1.0, 4.0, 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			100/255,100/255,100/255, 100/255,100/255,100/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v0-v1-v2-v3 front
			100/255,100/255,100/255,  50/255, 50/255, 50/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255,  // v0-v3-v4-v5 right
			100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
			100/255,100/255,100/255, 204/255,204/255,204/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  // v1-v6-v7-v2 left
			 35/255, 35/255, 35/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v7-v4-v3-v2 down
			 35/255, 35/255, 35/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255, 204/255,204/255,204/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Draw Right Leg
	g_modelMatrix.translate(5.0, -5.0, 0.0);
	drawBox(gl, n, 1.0, 3.0, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v0-v1-v2-v3 front
		180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 180/255, 35/255, 20/255,  // v0-v3-v4-v5 right
		180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255,  // v0-v5-v6-v1 up
		180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v1-v6-v7-v2 left
		220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v7-v4-v3-v2 down
		220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Draw Left Leg
	g_modelMatrix.translate(-3.0, 0.0, 0.0);
	drawBox(gl, n, 1.0, 3.0, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v0-v1-v2-v3 front
		180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 180/255, 35/255, 20/255,  // v0-v3-v4-v5 right
		180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255,  // v0-v5-v6-v1 up
		180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v1-v6-v7-v2 left
		220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v7-v4-v3-v2 down
		220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255　  // v4-v7-v6-v5 back
	]), null);
}

function drawFlyingDuck(gl, n, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	//// Draw a Duck
	// Draw Body
	var wingMulitplier = 18;
	
	g_modelMatrix.setTranslate(2*(fastCounter - 180) + x, y, z);
	g_modelMatrix.rotate(90, 0.0, 1.0, 0.0);
	
	
	g_modelMatrix.translate(0.0, 3.0, 0.0);
  drawBox(gl, n, 6.0, 6.0, 8.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		 84/255, 33/255,  7/255,  84/255, 33/255,  7/255, 40/255,  15/255,  4/255, 40/255,  15/255,  4/255,  // v0-v1-v2-v3 front
		100/255,100/255,100/255, 100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255,  // v0-v3-v4-v5 right
		100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
		100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v1-v6-v7-v2 left
		204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v7-v4-v3-v2 down
		100/255,100/255,100/255, 100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255　  // v4-v7-v6-v5 back
	]), null);
	
	drawBox(gl, n, 6.0, 6.0, 8.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v0-v1-v2-v3 front
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v0-v3-v4-v5 right
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v1-v6-v7-v2 left
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255,  // v7-v4-v3-v2 down
		100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255, 100/255,100/255,100/255　  // v4-v7-v6-v5 back
	]), null);

	// Draw Head
		g_modelMatrix.translate(0.0, 5.0, 4.5);
		drawBox(gl, n, 4.0, 5.0, 3.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		40/255, 100/255, 40/255, 40/255, 100/255,  40/255, 20/255,  50/255,  20/255, 20/255,  50/255,  20/255,  // v0-v1-v2-v3 front
		40/255, 100/255, 40/255, 20/255,  50/255,  20/255, 40/255, 100/255,  40/255, 100/255,  50/255, 200/255,  // v0-v3-v4-v5 right
		40/255, 100/255, 40/255, 100/255,  50/255, 200/255, 100/255,  50/255, 200/255, 40/255, 100/255,  40/255,  // v0-v5-v6-v1 up
		40/255, 100/255, 40/255, 100/255,  50/255, 200/255, 40/255, 100/255,  40/255, 20/255,  50/255,  20/255,  // v1-v6-v7-v2 left
		40/255, 100/255, 40/255, 40/255, 100/255,  40/255, 20/255,  50/255,  20/255, 20/255,  50/255,  20/255,  // v7-v4-v3-v2 down
		40/255, 100/255, 40/255, 40/255, 100/255,  40/255, 100/255,  50/255, 200/255, 50/255,  30/255, 160/255　  // v4-v7-v6-v5 back
		]), null);
  
		// Draw Beak
		g_modelMatrix.translate(0.0, 1.0, 2.5);
		drawBox(gl, n, 3.0, 2.0, 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		225/255,185/255, 50/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255,  // v0-v1-v2-v3 front
		225/255,185/255, 50/255, 225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255,  // v0-v3-v4-v5 right
		225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255,  // v0-v5-v6-v1 up
		225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255,  // v1-v6-v7-v2 left
		200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255,  // v7-v4-v3-v2 down
		200/255,130/255, 40/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255,   // v4-v7-v6-v5 back
		]), null);
	
		// Draw Right Eye
		g_modelMatrix.translate(1.0, 2.5, -1.0);
		drawBox(gl, n, 0.8, 0.8, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v1-v2-v3 front
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v3-v4-v5 right
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v5-v6-v1 up
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v1-v6-v7-v2 left
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v7-v4-v3-v2 down
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255　  // v4-v7-v6-v5 back
		]), null);
	
		// Draw Left Eye
		g_modelMatrix.translate(-2.0, 0.0, 0.0);
		drawBox(gl, n, 0.8, 0.8, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v1-v2-v3 front
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v3-v4-v5 right
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v5-v6-v1 up
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v1-v6-v7-v2 left
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v7-v4-v3-v2 down
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255　  // v4-v7-v6-v5 back
		]), null);
	
	// Draw Right Wing
	g_modelMatrix.translate(4.5, -6.5, -6.0);
	pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(180, 0.0, 0.0, 1.0);
		g_modelMatrix.translate(0.0, -4.0, 0.0);
		
		g_modelMatrix.rotate(35, 0.0, 0.0, 1.0);
		
		g_modelMatrix.rotate(30*Math.sin(toRadians(wingMulitplier*fastCounter)), 0.0, 0.0, 1.0);
		
		drawBox(gl, n, 1.0, 4.0, 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			100/255,100/255,100/255, 100/255,100/255,100/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v0-v1-v2-v3 front
			100/255,100/255,100/255,  50/255, 50/255, 50/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255,  // v0-v3-v4-v5 right
			100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
			100/255,100/255,100/255, 204/255,204/255,204/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  // v1-v6-v7-v2 left
			 35/255, 35/255, 35/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v7-v4-v3-v2 down
			 35/255, 35/255, 35/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255, 204/255,204/255,204/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Draw Left Wing
	g_modelMatrix.translate(-7.0, 0.0, 0.0);
	pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(180, 0.0, 0.0, 1.0);
		g_modelMatrix.translate(0.0, -4.0, 0.0);
		
		g_modelMatrix.rotate(-35, 0.0, 0.0, 1.0);
		
		g_modelMatrix.rotate(30*Math.sin(toRadians(wingMulitplier*fastCounter)), 0.0, 0.0, -1.0);
		drawBox(gl, n, 1.0, 4.0, 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			100/255,100/255,100/255, 100/255,100/255,100/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v0-v1-v2-v3 front
			100/255,100/255,100/255,  50/255, 50/255, 50/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255,  // v0-v3-v4-v5 right
			100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
			100/255,100/255,100/255, 204/255,204/255,204/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  // v1-v6-v7-v2 left
			 35/255, 35/255, 35/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v7-v4-v3-v2 down
			 35/255, 35/255, 35/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255, 204/255,204/255,204/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Centre the legs
	g_modelMatrix.translate(3.5, -5.0, 0.0);
	
	// Draw Right Leg
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(1.5, 0.0, 0.0);
		
		g_modelMatrix.rotate(180, 0.0, 0.0, 1.0);
		g_modelMatrix.translate(0.0, -3.0, 0.0);
		
		g_modelMatrix.rotate(60, -1.0, 0.0, 0.0);
		drawBox(gl, n, 1.0, 3.0, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v0-v1-v2-v3 front
			180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 180/255, 35/255, 20/255,  // v0-v3-v4-v5 right
			180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255,  // v0-v5-v6-v1 up
			180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v1-v6-v7-v2 left
			220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v7-v4-v3-v2 down
			220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Draw Left Leg
	pushMatrix(g_modelMatrix);
		g_modelMatrix.translate(-1.5, 0.0, 0.0);
		
		g_modelMatrix.rotate(180, 0.0, 0.0, 1.0);
		g_modelMatrix.translate(0.0, -3.0, 0.0);
		
		g_modelMatrix.rotate(60, -1.0, 0.0, 0.0);
		drawBox(gl, n, 1.0, 3.0, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v0-v1-v2-v3 front
			180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 180/255, 35/255, 20/255,  // v0-v3-v4-v5 right
			180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255,  // v0-v5-v6-v1 up
			180/255, 35/255, 20/255, 180/255, 35/255, 20/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v1-v6-v7-v2 left
			220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 220/255, 45/255, 25/255,  // v7-v4-v3-v2 down
			220/255, 45/255, 25/255, 220/255, 45/255, 25/255, 180/255, 35/255, 20/255, 180/255, 35/255, 20/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
}

function drawSwan(gl, n, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	//// Draw a Swan
	// Draw Body
	var wingMulitplier = 8;
	
  g_modelMatrix.setTranslate(50 * Math.cos(toRadians(slowCounter)) + x, y, 20 * Math.sin(toRadians(slowCounter)) + z);
	g_modelMatrix.rotate(slowCounter, 0.0, -1.0, 0.0);
	
	g_modelMatrix.translate(0.0, 2 * 3.0, 0.0);
  drawBox(gl, n, 2 * 6.0, 2 * 6.0 - 2.0, 2 * 8.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v1-v2-v3 front
		190/255,190/255,190/255, 190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255,  // v0-v3-v4-v5 right
		190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255,  // v0-v5-v6-v1 up
		190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255,  // v1-v6-v7-v2 left
		240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v7-v4-v3-v2 down
		190/255,190/255,190/255, 190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255　  // v4-v7-v6-v5 back
	]), null);

	// Draw Head
		g_modelMatrix.translate(2 * 0.0, 2 * 4.0 - 2.0, 2 * 4.5);
		drawBox(gl, n, 2 * 4.0, 2 * 6.0, 2 * 3.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v1-v2-v3 front
		190/255,190/255,190/255, 190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255,  // v0-v3-v4-v5 right
		190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255,  // v0-v5-v6-v1 up
		190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255,  // v1-v6-v7-v2 left
		240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v7-v4-v3-v2 down
		190/255,190/255,190/255, 190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255　  // v4-v7-v6-v5 back
	]), null);
  
		// Draw Beak
		g_modelMatrix.translate(2 * 0.0, 2 * 1.0, 2 * 2.5);
		drawBox(gl, n, 2 * 3.0, 2 * 2.0, 2 * 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		225/255,185/255, 50/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255,  // v0-v1-v2-v3 front
		225/255,185/255, 50/255, 225/255,185/255, 50/255, 240/255,130/255, 40/255, 240/255,130/255, 40/255,  // v0-v3-v4-v5 right
		225/255,185/255, 50/255, 240/255,130/255, 40/255, 240/255,130/255, 40/255, 225/255,185/255, 50/255,  // v0-v5-v6-v1 up
		225/255,185/255, 50/255, 240/255,130/255, 40/255, 240/255,130/255, 40/255, 225/255,185/255, 50/255,  // v1-v6-v7-v2 left
		240/255,130/255, 40/255, 240/255,130/255, 40/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255,  // v7-v4-v3-v2 down
		240/255,130/255, 40/255, 240/255,130/255, 40/255, 240/255,130/255, 40/255, 240/255,130/255, 40/255,   // v4-v7-v6-v5 back
		]), null);
	
		// Draw Right Eye
		g_modelMatrix.translate(2 * 1.0, 2 * 3.0, 2 * -1.0);
		drawBox(gl, n, 2 * 1.0, 2 * 1.0, 2 * 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v1-v2-v3 front
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v3-v4-v5 right
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v5-v6-v1 up
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v1-v6-v7-v2 left
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v7-v4-v3-v2 down
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255　  // v4-v7-v6-v5 back
		]), null);
	
		// Draw Left Eye
		g_modelMatrix.translate(2 * -2.0, 2 * 0.0, 2 * 0.0);
		drawBox(gl, n, 2 * 1.0, 2 * 1.0, 2 * 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v1-v2-v3 front
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v3-v4-v5 right
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v5-v6-v1 up
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v1-v6-v7-v2 left
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v7-v4-v3-v2 down
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255　  // v4-v7-v6-v5 back
		]), null);
	
	// Draw Right Wing
	g_modelMatrix.translate(2 * 4.5, 2 * -6.0, 2 * -6.0);
	pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(180, 0.0, 0.0, 1.0);
		g_modelMatrix.translate(0.0, -2 * 4.0, 0.0);
		
		g_modelMatrix.rotate(35, 0.0, 0.0, 1.0);
		
		g_modelMatrix.rotate(30*Math.sin(toRadians(wingMulitplier*slowCounter)), 0.0, 0.0, 1.0);
		
		drawBox(gl, n, 2 * 1.0, 2 * 4.0, 2 * 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v1-v2-v3 front
			190/255,190/255,190/255, 190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255,  // v0-v3-v4-v5 right
			190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255,  // v0-v5-v6-v1 up
			190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255,  // v1-v6-v7-v2 left
			240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v7-v4-v3-v2 down
			190/255,190/255,190/255, 190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Draw Left Wing
	g_modelMatrix.translate(2 * -7.0, 2 * 0.0, 2 * 0.0);
	pushMatrix(g_modelMatrix);
		g_modelMatrix.rotate(180, 0.0, 0.0, 1.0);
		g_modelMatrix.translate(0.0, -2 * 4.0, 0.0);
		
		g_modelMatrix.rotate(-35, 0.0, 0.0, 1.0);
		
		g_modelMatrix.rotate(30*Math.sin(toRadians(wingMulitplier*slowCounter)), 0.0, 0.0, -1.0);
		drawBox(gl, n, 2 * 1.0, 2 * 4.0, 2 * 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
			190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v0-v1-v2-v3 front
			190/255,190/255,190/255, 190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255,  // v0-v3-v4-v5 right
			190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255,  // v0-v5-v6-v1 up
			190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255,  // v1-v6-v7-v2 left
			240/255,240/255,240/255, 240/255,240/255,240/255, 190/255,190/255,190/255, 190/255,190/255,190/255,  // v7-v4-v3-v2 down
			190/255,190/255,190/255, 190/255,190/255,190/255, 240/255,240/255,240/255, 240/255,240/255,240/255　  // v4-v7-v6-v5 back
		]), null);
	g_modelMatrix = popMatrix();
	
	// Draw Right Leg
	g_modelMatrix.translate(2 * 5.0, 2 * -5.0 + 2.0, 2 * 0.0);
	drawBox(gl, n, 2 * 1.0, 2 * 3.0, 2 * 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
	 20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  // v0-v1-v2-v3 front
	 20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  // v0-v3-v4-v5 right
	 20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  // v0-v5-v6-v1 up
	 20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  // v1-v6-v7-v2 left
	 20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  // v7-v4-v3-v2 down
	 20/255, 20/255, 20/255,   0/255,  0/255,  0/255,  20/255, 20/255, 20/255,   0/255,  0/255,  0/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Draw Left Leg
	g_modelMatrix.translate(2 * -3.0, 2 * 0.0, 2 * 0.0);
	drawBox(gl, n, 2 * 1.0, 2 * 3.0, 2 * 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v1-v2-v3 front
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v3-v4-v5 right
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v0-v5-v6-v1 up
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v1-v6-v7-v2 left
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,  // v7-v4-v3-v2 down
		  0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255,   0/255,  0/255,  0/255　  // v4-v7-v6-v5 back
		]), null);
}

function drawBushelOfReeds(gl, n, offset, lean, speed, sectionLength, distance, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	drawReed(gl, n, offset, lean, speed, sectionLength + 1.0, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	drawReed(gl, n, offset - 5, lean, speed, sectionLength + 0.8, x + distance, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	drawReed(gl, n, offset - 5, lean, speed, sectionLength + 0.4, x - distance, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	drawReed(gl, n, offset + 5, lean, speed, sectionLength + 0.6, x, y, z + distance, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
	drawReed(gl, n, offset + 5, lean, speed, sectionLength + 0.2, x, y, z - distance, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
}

function drawReed(gl, n, offset, lean, speed, sectionLength, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	//// Draw Reed
  g_modelMatrix.setTranslate(x, y, z);
	
  drawBox(gl, n, 1.5, sectionLength, 1.5, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255, 65/255,0/255, 0/255, 65/255,0/255, 0/255, 50/255,0/255, 0/255, 50/255,0/255,  // v0-v1-v2-v3 front
		0/255, 65/255,0/255, 0/255, 50/255,0/255, 0/255, 50/255,0/255, 0/255, 65/255,0/255,  // v0-v3-v4-v5 right
		0/255, 65/255,0/255, 0/255, 65/255,0/255, 0/255, 65/255,0/255, 0/255, 65/255,0/255,  // v0-v5-v6-v1 up
		0/255, 65/255,0/255, 0/255, 65/255,0/255, 0/255, 50/255,0/255, 0/255, 50/255,0/255,  // v1-v6-v7-v2 left
		0/255, 50/255,0/255, 0/255, 50/255,0/255, 0/255, 50/255,0/255, 0/255, 50/255,0/255,  // v7-v4-v3-v2 down
		0/255, 50/255,0/255, 0/255, 50/255,0/255, 0/255, 65/255,0/255, 0/255, 65/255,0/255　  // v4-v7-v6-v5 back
	]), null);
	
	g_modelMatrix.translate(0.0, sectionLength, 0.0);
	g_modelMatrix.rotate(lean * Math.sin(toRadians(offset + (fastCounter*speed))), 1.0, 0.0, 1.0);
	drawBox(gl, n, 1.25, sectionLength, 1.25, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255, 80/255,0/255, 0/255, 80/255,0/255, 0/255, 65/255,0/255, 0/255, 65/255,0/255,  // v0-v1-v2-v3 front
		0/255, 80/255,0/255, 0/255, 65/255,0/255, 0/255, 65/255,0/255, 0/255, 80/255,0/255,  // v0-v3-v4-v5 right
		0/255, 80/255,0/255, 0/255, 80/255,0/255, 0/255, 80/255,0/255, 0/255, 80/255,0/255,  // v0-v5-v6-v1 up
		0/255, 80/255,0/255, 0/255, 80/255,0/255, 0/255, 65/255,0/255, 0/255, 65/255,0/255,  // v1-v6-v7-v2 left
		0/255, 65/255,0/255, 0/255, 65/255,0/255, 0/255, 65/255,0/255, 0/255, 65/255,0/255,  // v7-v4-v3-v2 down
		0/255, 65/255,0/255, 0/255, 65/255,0/255, 0/255, 80/255,0/255, 0/255, 80/255,0/255　  // v4-v7-v6-v5 back
	]), null);
	
	g_modelMatrix.translate(0.0, sectionLength, 0.0);
	g_modelMatrix.rotate(lean * Math.sin(toRadians(offset + (fastCounter*speed))), 1.0, 0.0, 1.0);
	drawBox(gl, n, 1.0, sectionLength, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255, 95/255,0/255, 0/255, 95/255,0/255, 0/255, 80/255,0/255, 0/255, 80/255,0/255,  // v0-v1-v2-v3 front
		0/255, 95/255,0/255, 0/255, 80/255,0/255, 0/255, 80/255,0/255, 0/255, 95/255,0/255,  // v0-v3-v4-v5 right
		0/255, 95/255,0/255, 0/255, 95/255,0/255, 0/255, 95/255,0/255, 0/255, 95/255,0/255,  // v0-v5-v6-v1 up
		0/255, 95/255,0/255, 0/255, 95/255,0/255, 0/255, 80/255,0/255, 0/255, 80/255,0/255,  // v1-v6-v7-v2 left
		0/255, 80/255,0/255, 0/255, 80/255,0/255, 0/255, 80/255,0/255, 0/255, 80/255,0/255,  // v7-v4-v3-v2 down
		0/255, 80/255,0/255, 0/255, 80/255,0/255, 0/255, 95/255,0/255, 0/255, 95/255,0/255　  // v4-v7-v6-v5 back
	]), null);
	
	g_modelMatrix.translate(0.0, sectionLength, 0.0);
	g_modelMatrix.rotate(lean * Math.sin(toRadians(offset + (fastCounter*speed))), 1.0, 0.0, 1.0);
	drawBox(gl, n, 0.75, sectionLength, 0.75, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255, 105/255,0/255, 0/255, 105/255,0/255, 0/255, 95/255,0/255, 0/255, 95/255,0/255,  // v0-v1-v2-v3 front
		0/255, 105/255,0/255, 0/255, 95/255,0/255, 0/255, 95/255,0/255, 0/255, 105/255,0/255,  // v0-v3-v4-v5 right
		0/255, 105/255,0/255, 0/255, 105/255,0/255, 0/255, 105/255,0/255, 0/255, 105/255,0/255,  // v0-v5-v6-v1 up
		0/255, 105/255,0/255, 0/255, 105/255,0/255, 0/255, 95/255,0/255, 0/255, 95/255,0/255,  // v1-v6-v7-v2 left
		0/255, 95/255,0/255, 0/255, 95/255,0/255, 0/255, 95/255,0/255, 0/255, 95/255,0/255,  // v7-v4-v3-v2 down
		0/255, 95/255,0/255, 0/255, 95/255,0/255, 0/255, 105/255,0/255, 0/255, 105/255,0/255　  // v4-v7-v6-v5 back
	]), null);

}

function drawFountain(gl, n, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(x, y, z);
	
	var multiplier = 18;
	
	// Fountain Head
	drawBox(gl, n, 3.0, 5.0, 3.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255,  // v0-v1-v2-v3 front
		10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255,  // v0-v3-v4-v5 right
		10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255,  // v0-v5-v6-v1 up
		10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255,  // v1-v6-v7-v2 left
		10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255,  // v7-v4-v3-v2 down
		10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255, 10/255,10/255,10/255　  // v4-v7-v6-v5 back
	]), null);
	
	g_modelMatrix.setTranslate(40 * Math.cos(toRadians(fastCounter*multiplier)) + x - 39, 30 * Math.sin(toRadians(fastCounter*multiplier)) + y, z);
	g_modelMatrix.rotate(90, 0.0, 0.0, 1.0);
	g_modelMatrix.rotate(fastCounter*multiplier, 0.0, 0.0, 1.0);
	drawBox(gl, n, 8.0, 2.0, 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255,  // v0-v1-v2-v3 front
		30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255,  // v0-v3-v4-v5 right
		30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255,  // v0-v5-v6-v1 up
		30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255,  // v1-v6-v7-v2 left
		30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255,  // v7-v4-v3-v2 down
		30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255, 30/255,70/255,90/255　  // v4-v7-v6-v5 back
	]), null);
}


var g_matrixStack = []; // Array for storing a matrix
function pushMatrix(m) { // Store the specified matrix to the array
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

function popMatrix() { // Retrieve the matrix from the array
  return g_matrixStack.pop();
}

var g_normalMatrix = new Matrix4();  // Coordinate transformation matrix for normals

function setupTex(gl) {
	var texture = gl.createTexture();   // Create a texture object
	if (!texture) {
		console.log('Failed to create the texture object');
		return false;
	}
	
	texture.image = new Image();  // Create the image object
	if (!texture.image) {
		console.log('Failed to create the image object');
		return false;
	}
	return texture;
}

// Draw rectangular solid
function drawBox(gl, n, width, height, depth, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, colors, texture) {
  pushMatrix(g_modelMatrix);   // Save the model matrix
    // Scale a cube and draw
    g_modelMatrix.scale(width, height, depth);
		
		if (!initArrayBuffer(gl, 'a_Color', colors, gl.FLOAT, 3)) return -1;
	
		var LQ = document.getElementById("LQ").checked;
		if (texture == "grass" && !LQ){
			// Get the storage location of u_Sampler
			var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
			if (!u_Sampler) {
				console.log('Failed to get the storage location of u_Sampler');
				return false;
			}
			textureObject = setupTex(gl);
			
			textureObject.image.onload = function(){
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
				
				// Assign u_Sampler1 to TEXTURE0
				gl.uniform1i(u_Sampler, 0);
				
				// Enable texture unit0
				gl.activeTexture(gl.TEXTURE0);
				// Bind the texture object to the target
				gl.bindTexture(gl.TEXTURE_2D, textureObject);

				// Set the texture image
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureObject.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			};
			
			textureObject.image.src = '../resources/grass1.jpg';
		}
		else {			
			tex = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, tex);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255,255,255,255]));
		}
		
    // Calculate the model view project matrix and pass it to u_MvpMatrix
    g_mvpMatrix.set(viewProjMatrix);
    g_mvpMatrix.multiply(g_modelMatrix);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);
    // Calculate the normal transformation matrix and pass it to u_NormalMatrix
    g_normalMatrix.setInverseOf(g_modelMatrix);
    g_normalMatrix.transpose();
    gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);
		
    // Draw
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);
  g_modelMatrix = popMatrix();   // Retrieve the model matrix
}