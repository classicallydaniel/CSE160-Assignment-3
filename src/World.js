// Vertex shader program
var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_Position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix; 
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
        v_UV = a_UV;
    }
`;

// Fragment shader program
var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;
    uniform sampler2D u_Sampler0;
    uniform sampler2D u_Sampler1;
    uniform sampler2D u_Sampler2;
    uniform sampler2D u_Sampler3;
    uniform int u_whichTexture;
    void main() {

        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;                 // Use color
        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV,1.0,1.0);          // Use UV debug color
        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV); // Use texture0 (dirt block)    
        } else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV); // Use texture1 (background)
        } else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV); // Use texture2 (floor)
        } else if (u_whichTexture == 3) {
            gl_FragColor = texture2D(u_Sampler3, v_UV); // Use texture3 (wall)
        } else {
            gl_FragColor = vec4(1,.2,.2,1);             // Error, put Redish
        }
    }
`;

// Global related to UI elements
let g_shapesList = [];
let g_globalAngle = 0;
let g_yellowAngle = 0;
let g_magentaAngle = 0;
let g_yellowAnimation=false;
let g_magentaAnimation=false;

// Global variables for shape properties
let g_selectedType = 'square'; // Default shape type
let g_selectedColor = [1.0, 0.0, 0.0, 1.0]; // Default color (red)
let g_selectedSize = 5.0; // Default size

let a_Position;
let a_UV;
var g_prevMouseX = -1; // Previous mouse X position
var g_mouseSensitivity = 0.05; // Sensitivity factor for mouse movement
var g_accumulatedRotation = 0; // Accumulated rotation angle
let camera = new Camera();

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return false;
    }
    gl.enable(gl.DEPTH_TEST);

    return true;
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return false;
    }

    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return false;
    }

    a_UV = gl.getAttribLocation(gl.program, 'a_UV');
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return false;
    }

    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return false;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return false;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return false;
    }

    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return false;
    }

    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return false;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0) {
        console.log('Failed to get the storage location of u_Sampler0');
        return false;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1) {
        console.log('Failed to get the storage location of u_Sampler1');
        return false;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2) {
        console.log('Failed to get the storage location of u_Sampler2');
        return false;
    }

    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    if (!u_Sampler3) {
        console.log('Failed to get the storage location of u_Sampler3');
        return false;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return false;
    }

    // Set an initial value for the model matrix
    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

    return true;
}

function addActionsForHtmlUI() {
    // Button Events
    document.getElementById('animationYellowOnButton').onclick = function() {g_yellowAnimation=true;};
    document.getElementById('animationYellowOffButton').onclick = function() {g_yellowAnimation=false;};
    document.getElementById('animationMagentaOnButton').onclick = function() {g_magentaAnimation=true;};
    document.getElementById('animationMagentaOffButton').onclick = function() {g_magentaAnimation=false;};

    // Color Slider Events
    document.getElementById('magentaSlide').addEventListener("mousemove", function() { g_magentaAngle = this.value; renderAllShapes(); });
    document.getElementById('yellowSlide').addEventListener("mousemove", function() { g_yellowAngle = this.value; renderAllShapes(); });

    // Size Slider Events
    document.getElementById('angleSlide').addEventListener("mousemove", function() { g_globalAngle = this.value; renderAllShapes(); });
}

function initTextures() {
    var image = new Image();    // Create the image object
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Load texture 0 (dirt block)
    var image0 = new Image();
    image0.onload = function() { sendImageToTEXTURE(image0, 0); };
    image0.src = 'images/dirt_block.jpg'

    // Load texture 1 (background)
    var image1 = new Image();
    image1.onload = function() { sendImageToTEXTURE(image1, 1); };
    image1.src = 'images/background.jpg';

    // Load texture 2 (floor)
    var image2 = new Image();
    image2.onload = function() { sendImageToTEXTURE(image2, 2); };
    image2.src = 'images/floor.jpg';
    // Load texture 2 (floor)

    var image3 = new Image();
    image3.onload = function() { sendImageToTEXTURE(image3, 3); };
    image3.src = 'images/wall.jpg';

    return true;
}

function sendImageToTEXTURE(image, textureUnit) {
    var texture = gl.createTexture();   // Create a texture object
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image's y axis
    gl.activeTexture(gl.TEXTURE0 + textureUnit); // Activate the texture unit
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Set the sampler to the correct texture unit
    if (textureUnit === 0) {
        gl.uniform1i(u_Sampler0, 0); // Bind TEXTURE0 to u_Sampler0
    } else if (textureUnit === 1) {
        gl.uniform1i(u_Sampler1, 1); // Bind TEXTURE1 to u_Sampler1
    } else if (textureUnit === 2) {
        gl.uniform1i(u_Sampler2, 2); // Bind TEXTURE2 to u_Sampler2
    } else if (textureUnit === 3) {
        gl.uniform1i(u_Sampler3, 3); // Bind TEXTURE2 to u_Sampler3
    }

    console.log('Finished loading texture for unit:', textureUnit);
}

function main() {
    // Set up canvas and gl variables
    if (!setupWebGL()) {
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to initialize shaders.');
        return;
    }

    // Set up GLSL shader programs and connect GLSL variables
    if (!connectVariablesToGLSL()) {
        return;
    }

    // Set up actions for the HTML UI elements
    addActionsForHtmlUI();

    document.onkeydown = keydown;

    initTextures();

    // Register function (event handler) to be called on mouse movement
    canvas.onmousemove = function(ev) {
        onMove(ev); // Call onMove() whenever the mouse moves
    };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    requestAnimationFrame(tick);
}

var g_startTime=performance.now()/1000.0;
var g_seconds=performance.now()/1000.0-g_startTime;

// Called by browser repeatedly whenever it's time
function tick() {
    // Save the current time
    g_seconds=performance.now()/1000.0-g_startTime;

    updateAnimationAngles();

    renderAllShapes();

    // Tell the browser to update again when it has time
    requestAnimationFrame(tick);
}

// Update the angles of everything if currently animated
function updateAnimationAngles() {
    if (g_yellowAnimation) {
        g_yellowAngle = (45*Math.sin(g_seconds));
    }
    if (g_magentaAnimation) {
        g_magentaAngle = (45*Math.sin(3*g_seconds));
    }
}

var g_eye=[0,0,3];
var g_at=[0,0,-100];
var g_up=[0,1,0];

// Variables to track rotation direction
let rotatingLeft = false;
let rotatingRight = false;
let tiltingUp = false;
let tiltingDown = false;

function onMove(ev) {
    // Get the current mouse position
    let x = ev.clientX;
    let y = ev.clientY;

    // A "dead zone" margin around the center of the canvas
    const deadZone = 70; // Pixels (adjust as needed)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Check if the mouse is inside the dead zone
    let insideDeadZone = (
        Math.abs(x - centerX) < deadZone &&
        Math.abs(y - centerY) < deadZone
    );

    // If inside the dead zone, stop movement
    if (insideDeadZone) {
        rotatingLeft = false;
        rotatingRight = false;
        tiltingUp = false;
        tiltingDown = false;
        return;
    }

    // Rotation direction
    rotatingLeft = x < centerX - deadZone;
    rotatingRight = x > centerX + deadZone;
    tiltingUp = y < centerY - deadZone;
    tiltingDown = y > centerY + deadZone;
}

// Continuous update function for camera movement
function updateCameraRotation() {
    const rotationSpeed = 1.5; // Degrees per frame

    if (rotatingLeft) {
        camera.panLeft(rotationSpeed);
    } 
    if (rotatingRight) {
        camera.panRight(rotationSpeed);
    }
    if (tiltingUp) {
        camera.tiltUp(-rotationSpeed);
    } 
    if (tiltingDown) {
        camera.tiltUp(rotationSpeed);
    }

    // Update camera vectors
    g_eye = camera.eye.toArray();
    g_at = camera.at.toArray();
    g_up = camera.up.toArray();

    requestAnimationFrame(updateCameraRotation);
}

// Start the continuous camera update loop
updateCameraRotation();


function keydown(ev) {
    if (ev.key === 'w' || ev.key === 'W') {   // Forward
        camera.moveForward();
    } else if (ev.key === 's' || ev.key === 'S') { // Backward
        camera.moveBack();
    } else if (ev.key === 'a' || ev.key === 'A') { // Left
        camera.moveLeft();
    } else if (ev.key === 'd' || ev.key === 'D') { // Right
        camera.moveRight();
    } else if (ev.key === 'q' || ev.key === 'Q') { // Pan left
        camera.panLeft(5); // Rotate by 5 degrees
    } else if (ev.key === 'e' || ev.key === 'E') { // Pan right
        camera.panRight(5); // Rotate by 5 degrees
    } else if (ev.key === 'f' || ev.key === 'F') { // Add block
        addBlock();
    } else if (ev.key === 'g' || ev.key === 'G') { // Delete block
        deleteBlock();
    }

    // Update global variables with the new camera position and look-at point
    g_eye = camera.eye.toArray();
    g_at = camera.at.toArray();
    g_up = camera.up.toArray();

    // Log the new camera position and look-at point
    console.log("Eye:", g_eye);
    console.log("At:", g_at);
}

var g_map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 2, 0, 1, 0, 0, 0, 0, 1, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0, 3, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 0, 1, 0, 0, 3, 0, 2, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 2, 0, 1, 3, 0, 0, 0, 1, 0, 1],
    [1, 0, 3, 0, 0, 0, 0, 1, 0, 2, 0, 1, 0, 0, 0, 0, 3, 0, 1, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 2, 0, 0, 3, 0, 0, 0, 1, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 3, 0, 1, 0, 0, 0, 0, 1, 2, 1],
    [1, 3, 0, 0, 0, 0, 2, 0, 1, 0, 1, 0, 1, 0, 0, 3, 0, 2, 0, 1, 0, 0, 0, 1, 0, 2, 0, 3, 0, 0, 1, 1],
    [1, 0, 0, 1, 0, 3, 0, 0, 1, 0, 0, 2, 0, 0, 0, 1, 0, 3, 0, 0, 1, 0, 0, 1, 0, 3, 0, 0, 0, 0, 2, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 3, 0, 0, 2, 0, 0, 1, 0, 1, 0, 0, 3, 0, 0, 0, 1, 2, 0, 1, 0, 3, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 2, 0, 1, 0, 0, 3, 0, 0, 0, 0, 1, 0, 3, 0, 0, 1, 0, 0, 2, 0, 1, 0, 0, 3, 0, 0, 0, 1, 0, 2, 1],
    [1, 0, 0, 0, 3, 0, 1, 0, 2, 0, 1, 0, 0, 3, 0, 0, 0, 1, 0, 0, 2, 0, 1, 0, 1, 0, 3, 0, 0, 0, 0, 1],
    [1, 1, 0, 0, 1, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 1, 0, 0, 0, 2, 0, 1, 0, 3, 0, 0, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 3, 0, 0, 0, 1, 0, 1, 0, 3, 0, 0, 0, 2, 0, 1, 0, 0, 1, 0, 3, 0, 0, 0, 2, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 3, 0, 0, 1, 0, 0, 0, 3, 0, 1, 0, 2, 0, 0, 1, 0, 0, 0, 3, 0, 2, 0, 1, 0, 0, 0, 1],
    [1, 3, 0, 0, 0, 2, 0, 1, 0, 3, 0, 0, 0, 1, 0, 2, 0, 0, 3, 0, 1, 0, 0, 0, 3, 0, 0, 0, 2, 0, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

function drawMap() {
    let walls = []; // Store all walls

    for (let x = 0; x < g_map.length; x++) {
        for (let y = 0; y < g_map[x].length; y++) {
            let height = g_map[x][y]; // Get height from the map (1 means 1 block high, 2 means 2 blocks, etc.)

            for (let h = 0; h < height; h++) { // Loop through the height dimension
                let wall = new Cube(); // Create a new Cube each time

                wall.textureNum = 3;
                wall.matrix.setIdentity();
                
                // Translate based on x, y, and height (h)
                wall.matrix.translate(
                    x - g_map.length / 2,   // X position (centered)
                    h - 0.75,               // Y position (stacked vertically)
                    y - g_map[x].length / 2 // Z position (centered)
                );

                walls.push(wall); // Store wall in the array
            }
        }
    }

    // Now render all stored walls efficiently
    for (let wall of walls) {
        wall.renderfaster();
    }
}

function renderAllShapes() {
    // Check the time at the start of this function
    var startTime = performance.now();

    // Pass the projection matrix
    var projMat = new Matrix4();
    projMat.setPerspective(50, 1 * canvas.width / canvas.height, 1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    // Pass the view matrix
    var viewMat = new Matrix4();
    viewMat.setLookAt(g_eye[0], g_eye[1], g_eye[2], g_at[0], g_at[1], g_at[2], g_up[0], g_up[1], g_up[2]);    // (eye, at, up)
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // Pass the matrix to u_ModelMatrix attribute
    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear both the color and depth buffer before rendering
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the map
    drawMap();

    // Spawn whitestone randomly
    let whitestoneBlocks = [{ x: 2, z: 5 }, { x: -3, z: -2 }, { x: 4, z: 6 }];

    for (let whitestone of whitestoneBlocks) {
        let whitestoneCube = new Cube();
        whitestoneCube.textureNum = -2; // white
        whitestoneCube.matrix.translate(whitestone.x, -0.5, whitestone.z);
        whitestoneCube.matrix.scale(0.5, 0.5, 0.5);
        whitestoneCube.renderfaster();
    }

    // Draw the floor (dirt block texture)
    var floor = new Cube();
    floor.color = [1, 0, 0, 1];
    floor.textureNum = 2; // Use texture 2 (floor)
    floor.matrix.translate(0, -.75, 0);
    floor.matrix.scale(30, 0, 30);
    floor.matrix.translate(-0.5, 0, -0.5);
    floor.renderfaster();

    // Draw the sky (background texture)
    var sky = new Cube();
    sky.color = [1, 0, 0, 1];
    sky.textureNum = 1; // Use texture 1 (background/sky)
    sky.matrix.scale(50, 50, 50);
    sky.matrix.translate(-0.5, -0.5, -0.5);
    sky.renderfaster();

    // Draw the body cube (dirt block texture)
    var body = new Cube();
    body.color = [1, 0, 0, 1];
    body.textureNum = 0; // Use texture 0 (dirt block)
    body.matrix.translate(-.25, -.75, 0);
    body.matrix.rotate(-5, 1, 0, 0);
    body.matrix.scale(.5, .3, .5);
    body.renderfaster();

    // Yellow arm (dirt block texture)
    var yellow = new Cube();
    yellow.color = [1, 1, 0, 1];
    yellow.textureNum = 0; // Use texture 0 (dirt block)
    yellow.matrix.setTranslate(0, -.5, .003);
    yellow.matrix.rotate(-5, 1, 0, 0);
    yellow.matrix.rotate(-g_yellowAngle, 0, 0, 1);
    var yellowCoordinatesMat = new Matrix4(yellow.matrix);
    yellow.matrix.scale(0.25, .7, .5);
    yellow.matrix.translate(-.5, 0, 0);
    yellow.renderfaster();

    // Magenta box (dirt block texture)
    var box = new Cube();
    box.color = [1, 0, 1, 1];
    box.textureNum = 0; // Use texture 0 (dirt block)
    box.matrix = yellowCoordinatesMat;
    box.matrix.translate(0, 0.65, 0);
    box.matrix.rotate(g_magentaAngle, 0, 0, 1);
    box.matrix.scale(.3, .3, .3);
    box.matrix.translate(-.5, 0, -0.001);
    box.renderfaster();

    // Check the time at the end of the function, and show on web page
    var duration = performance.now() - startTime;
    sendTextToHTML(" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000 / duration));
}

function click(ev) {
    // Handle mouse click events
    let [x, y] = convertCoordinatesEventToGL(ev);
    g_shapesList.push({ type: g_selectedType, color: g_selectedColor.slice(), size: g_selectedSize, coords: [x, y] });
    renderAllShapes();
}

function addBlock() {
    let [mapX, mapZ] = getBlockInFront();

    // Prevent blocks from exceeding max height (e.g., 10)
    if (g_map[mapX][mapZ] < 10) {
        g_map[mapX][mapZ] += 1;
    }

    console.log(`Added block at (${mapX}, ${mapZ}), New Height: ${g_map[mapX][mapZ]}`);
    
    renderAllShapes();
}

function deleteBlock() {
    let [mapX, mapZ] = getBlockInFront();

    // Prevent negative height (ground level)
    if (g_map[mapX][mapZ] > 0) {
        g_map[mapX][mapZ] -= 1;
    }

    console.log(`Deleted block at (${mapX}, ${mapZ}), New Height: ${g_map[mapX][mapZ]}`);

    renderAllShapes();
}


function getBlockInFront() {
    let frontVector = camera.at.subtract(camera.eye).normalize(); // Get forward direction
    let targetX = Math.round(camera.eye.x + frontVector.x); // Approximate X in map
    let targetZ = Math.round(camera.eye.z + frontVector.z); // Approximate Z in map

    // Ensure the position is within bounds
    targetX = Math.max(0, Math.min(g_map.length - 1, targetX));
    targetZ = Math.max(0, Math.min(g_map[0].length - 1, targetZ));

    return [targetX, targetZ];
}

function click(ev) {
    // Handle mouse click events
    let [x, y] = convertCoordinatesEventToGL(ev);
    g_shapesList.push({ type: g_selectedType, color: g_selectedColor.slice(), size: g_selectedSize, coords: [x, y] });
    renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
    let rect = ev.target.getBoundingClientRect();
    let x = ((ev.clientX - rect.left) - canvas.width / 2) / (canvas.width / 2);
    let y = (canvas.height / 2 - (ev.clientY - rect.top)) / (canvas.height / 2);
    return [x, y];
}

function sendTextToHTML(text) {
    document.getElementById("numdot").innerHTML = text;
}