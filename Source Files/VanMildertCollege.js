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
	
var characterHeight = 40.0;

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

  // Set the clear color and enable the depth test
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
  viewProjMatrix.setPerspective(60.0, canvas.width / canvas.height, 1.0, 1000.0);
  viewProjMatrix.lookAt(0.0, characterHeight, 150.0, 0.0, 0.0, -1000.0, 0.0, 1.0, 0.0);
	
  // Set the light color (white)
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 2.3, 4.0, 3.5);
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.5, 0.5, 0.5);
	

  // Register the event handler to be called on key press
  document.onkeydown = function(ev){ keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); };
	
	draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	var mover = setInterval( function() { moveModels(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix); }
	, 1000/30);
}

var angleStep = 2.0;     // The increments of rotation angle (degrees)

var duckPosition = 0;
var duckAngle = 0.0;

var modelCounter = 0;
function moveModels(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix){
	
	modelCounter += 1;
	if (modelCounter % 60 == 0) {modelCounter = 0;}
	
	duckPosition += 1;
	
	duckAngle += 1;
	if (duckAngle % 360 == 0.0) {duckAngle = 0.0;}
	
	draw(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function keydown(ev, gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  switch (ev.keyCode) {
    case 40: // Up arrow key
      viewProjMatrix.rotate(angleStep, 1.0, 0.0, 0.0)
      break;
    case 38: // Down arrow key
      viewProjMatrix.rotate(angleStep, -1.0, 0.0, 0.0)
      break;
    case 39: // Right arrow key
      viewProjMatrix.rotate(angleStep, 0.0, 1.0, 0.0)
      break;
    case 37: // Left arrow key
      viewProjMatrix.rotate(angleStep, 0.0, -1.0, 0.0)
      break;
		case 87: // W key
      viewProjMatrix.translate(0.0, 0.0, 5.0)
      break;
    case 68: // D key
      viewProjMatrix.translate(-5.0, 0.0, 0.0)
      break;
		case 83: // S key
      viewProjMatrix.translate(0.0, 0.0, -5.0)
      break;
		case 65: // A key
      viewProjMatrix.translate(5.0, 0.0, 0.0)
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

	drawLeftBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	drawRightBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	drawBottomBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	drawBuilding1(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	drawWater(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	
	pushMatrix(g_modelMatrix);
	drawDuck(gl, n, 20.0, 2.0, -20.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	g_modelMatrix = popMatrix();
	
	pushMatrix(g_modelMatrix);
	drawDuck(gl, n, -20.0, 2.0, -20.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	g_modelMatrix = popMatrix();
	
	pushMatrix(g_modelMatrix);
	drawSwan(gl, n, 0.0, 0.0, 20.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
	g_modelMatrix = popMatrix();
}

function drawLeftBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(-100.0, 0.0, 0.0);
	drawBox(gl, n, 30.0, 10, 200.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
}

function drawRightBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(100.0, 0.0, 0.0);
	drawBox(gl, n, 30.0, 10, 200.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
}

function drawBottomBank(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(0.0, 0.0, 100.0);
	drawBox(gl, n, 230.0, 10, 30.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v1-v2-v3 front
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v3-v4-v5 right
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v0-v5-v6-v1 up
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v1-v6-v7-v2 left
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255,  // v7-v4-v3-v2 down
		0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255, 0/255,127/255,0/255　  // v4-v7-v6-v5 back
	]), "grass");
}

function drawBuilding1(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(0.0, 0.0, -150.0);
	drawBox(gl, n, 230.0, 300, 100.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v1-v2-v3 front
		255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v3-v4-v5 right
		255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v0-v5-v6-v1 up
		255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v1-v6-v7-v2 left
		255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255,  // v7-v4-v3-v2 down
		255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255, 255/255,255/255,255/255　  // v4-v7-v6-v5 back
	]), null);
}

function drawWater(gl, n, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	g_modelMatrix.setTranslate(0.0, 0.0, 0.0);
	drawBox(gl, n, 200.0, 5, 200.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v0-v1-v2-v3 front
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v0-v3-v4-v5 right
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v0-v5-v6-v1 up
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v1-v6-v7-v2 left
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255,  // v7-v4-v3-v2 down
		11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255, 11/255,50/255,70/255　  // v4-v7-v6-v5 back
	]), "water");
}

function drawDuck(gl, n, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	//// Draw a Duck
	// Draw Body
  g_modelMatrix.setTranslate(x,y,z);
	
	g_modelMatrix.rotate(duckAngle, 0.0, -1.0, 0.0);
	g_modelMatrix.translate(10*Math.cos(duckPosition/360), 0.0, 10*Math.sin(duckPosition/360));
	
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
	drawBox(gl, n, 1.0, 4.0, 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		100/255,100/255,100/255, 100/255,100/255,100/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v0-v1-v2-v3 front
		100/255,100/255,100/255,  50/255, 50/255, 50/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255,  // v0-v3-v4-v5 right
		100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
		100/255,100/255,100/255, 204/255,204/255,204/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  // v1-v6-v7-v2 left
		 35/255, 35/255, 35/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v7-v4-v3-v2 down
		 35/255, 35/255, 35/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255, 204/255,204/255,204/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Draw Left Wing
	g_modelMatrix.translate(-7.0, 0.0, 0.0);
	drawBox(gl, n, 1.0, 4.0, 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		100/255,100/255,100/255, 100/255,100/255,100/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v0-v1-v2-v3 front
		100/255,100/255,100/255,  50/255, 50/255, 50/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255,  // v0-v3-v4-v5 right
		100/255,100/255,100/255, 204/255,204/255,204/255, 204/255,204/255,204/255, 100/255,100/255,100/255,  // v0-v5-v6-v1 up
		100/255,100/255,100/255, 204/255,204/255,204/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  // v1-v6-v7-v2 left
		 35/255, 35/255, 35/255,  35/255, 35/255, 35/255,  50/255, 50/255, 50/255,  50/255, 50/255, 50/255,  // v7-v4-v3-v2 down
		 35/255, 35/255, 35/255,  35/255, 35/255, 35/255, 204/255,204/255,204/255, 204/255,204/255,204/255　  // v4-v7-v6-v5 back
	]), null);
	
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

function drawSwan(gl, n, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
	//// Draw a Swan
	// Draw Body
  g_modelMatrix.setTranslate(x,y,z);
	
	g_modelMatrix.rotate(duckAngle, 0.0, -1.0, 0.0);
	g_modelMatrix.translate(10*Math.cos(duckPosition/720), 0.0, 10*Math.sin(duckPosition/720));
	
	g_modelMatrix.translate(0.0, 2 * 3.0, 0.0);
  drawBox(gl, n, 2 * 6.0, 2 * 6.0 - 2.0, 2 * 8.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		150/255,150/255,150/255, 150/255,150/255,150/255, 150/255,150/255,150/255, 150/255,150/255,150/255,  // v0-v1-v2-v3 front
		150/255,150/255,150/255, 150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255,  // v0-v3-v4-v5 right
		150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255,  // v0-v5-v6-v1 up
		150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255,  // v1-v6-v7-v2 left
		200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255, 150/255,150/255,150/255,  // v7-v4-v3-v2 down
		150/255,150/255,150/255, 150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255　  // v4-v7-v6-v5 back
	]), null);

	// Draw Head
		g_modelMatrix.translate(2 * 0.0, 2 * 4.0 - 2.0, 2 * 4.5);
		drawBox(gl, n, 2 * 4.0, 2 * 6.0, 2 * 3.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		150/255,150/255,150/255, 150/255,150/255,150/255, 150/255,150/255,150/255, 150/255,150/255,150/255,  // v0-v1-v2-v3 front
		150/255,150/255,150/255, 150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255,  // v0-v3-v4-v5 right
		150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255,  // v0-v5-v6-v1 up
		150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255,  // v1-v6-v7-v2 left
		200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255, 150/255,150/255,150/255,  // v7-v4-v3-v2 down
		150/255,150/255,150/255, 150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255　  // v4-v7-v6-v5 back
	]), null);
  
		// Draw Beak
		g_modelMatrix.translate(2 * 0.0, 2 * 1.0, 2 * 2.5);
		drawBox(gl, n, 2 * 3.0, 2 * 2.0, 2 * 2.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		225/255,185/255, 50/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255,  // v0-v1-v2-v3 front
		225/255,185/255, 50/255, 225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255,  // v0-v3-v4-v5 right
		225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255,  // v0-v5-v6-v1 up
		225/255,185/255, 50/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255,  // v1-v6-v7-v2 left
		200/255,130/255, 40/255, 200/255,130/255, 40/255, 225/255,185/255, 50/255, 225/255,185/255, 50/255,  // v7-v4-v3-v2 down
		200/255,130/255, 40/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255, 200/255,130/255, 40/255,   // v4-v7-v6-v5 back
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
	drawBox(gl, n, 2 * 1.0, 2 * 4.0, 2 * 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		150/255,150/255,150/255, 150/255,150/255,150/255, 150/255,150/255,150/255, 150/255,150/255,150/255,  // v0-v1-v2-v3 front
		150/255,150/255,150/255, 150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255,  // v0-v3-v4-v5 right
		150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255,  // v0-v5-v6-v1 up
		150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255,  // v1-v6-v7-v2 left
		200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255, 150/255,150/255,150/255,  // v7-v4-v3-v2 down
		150/255,150/255,150/255, 150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255　  // v4-v7-v6-v5 back
	]), null);
	
	// Draw Left Wing
	g_modelMatrix.translate(2 * -7.0, 2 * 0.0, 2 * 0.0);
	drawBox(gl, n, 2 * 1.0, 2 * 4.0, 2 * 6.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix, new Float32Array([
		150/255,150/255,150/255, 150/255,150/255,150/255, 150/255,150/255,150/255, 150/255,150/255,150/255,  // v0-v1-v2-v3 front
		150/255,150/255,150/255, 150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255,  // v0-v3-v4-v5 right
		150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255,  // v0-v5-v6-v1 up
		150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255,  // v1-v6-v7-v2 left
		200/255,200/255,200/255, 200/255,200/255,200/255, 150/255,150/255,150/255, 150/255,150/255,150/255,  // v7-v4-v3-v2 down
		150/255,150/255,150/255, 150/255,150/255,150/255, 200/255,200/255,200/255, 200/255,200/255,200/255　  // v4-v7-v6-v5 back
	]), null);
	
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
	
		if (texture == "grass"){
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
			
			textureObject.image.src = '../resources/grass2.jpg';
		}
		else if (texture == "water"){
			// Get the storage location of u_Sampler
			var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
			if (!u_Sampler) {
				console.log('Failed to get the storage location of u_Sampler');
				return false;
			}
			textureObject = setupTex(gl);
			
			textureObject.image.onload = function(){
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1); // Flip the image's y axis
				
				// Assign u_Sampler to TEXTURE1
				gl.uniform1i(u_Sampler, 1);
				
				// Enable texture unit1
				gl.activeTexture(gl.TEXTURE1);
				// Bind the texture object to the target
				gl.bindTexture(gl.TEXTURE_2D, textureObject);

				// Set the texture image
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, textureObject.image);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
			};
			
			textureObject.image.src = '../resources/grass2.jpg';
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