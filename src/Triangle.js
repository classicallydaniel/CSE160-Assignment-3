var g_vertexBuffer = null;
var g_uvBuffer = null;

function initTriangle3D() {
    g_vertexBuffer = gl.createBuffer();
    if (!g_vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }
    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
    // Assign the buffer to the a_Position attribute
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    // Enable the attribute
    gl.enableVertexAttribArray(a_Position);
}

function initTriangle3DUV() {
    // Initialize position buffer
    g_vertexBuffer = gl.createBuffer();
    if (!g_vertexBuffer) {
        console.error('Failed to create vertex buffer');
        return -1;
    }

    // Bind the buffer object to target and set attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
    gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    // Initialize UV buffer
    g_uvBuffer = gl.createBuffer();
    if (!g_uvBuffer) {
        console.error('Failed to create UV buffer');
        return -1;
    }

    // Bind the UV buffer object to target and set attribute
    gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
    gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_UV);
}

function drawTriangle3D(vertices) {
    var n = vertices.length / 3; // Number of vertices

    if (g_vertexBuffer == null) {
        initTriangle3D();
    }
    // Write data into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, n);
}

function drawTriangle3DUV(vertices, uv) {
    var n = vertices.length / 3; // Number of vertices

    // Initialize buffers if they haven't been created
    if (g_vertexBuffer == null || g_uvBuffer == null) {
        initTriangle3DUV();
    }

    // Upload vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, g_vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);

    // Upload UV data
    gl.bindBuffer(gl.ARRAY_BUFFER, g_uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uv), gl.DYNAMIC_DRAW);

    // Draw the triangles
    gl.drawArrays(gl.TRIANGLES, 0, n);
}