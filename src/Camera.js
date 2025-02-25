function multiplyVector3(matrix, v) {
    const elements = matrix.elements; // Access the matrix elements
    const x = elements[0] * v.x + elements[4] * v.y + elements[8] * v.z + elements[12];
    const y = elements[1] * v.x + elements[5] * v.y + elements[9] * v.z + elements[13];
    const z = elements[2] * v.x + elements[6] * v.y + elements[10] * v.z + elements[14];
    return new Vector(x, y, z);
}

class Camera {
    constructor() {
        this.eye = new Vector(0, 0, 3);      // Camera position
        this.at = new Vector(0, 0, -100);    // Look-at point
        this.up = new Vector(0, 1, 0);       // Up vector
    }

    // Move the camera forward
    moveForward() {
        const f = this.at.subtract(this.eye); // Forward vector
        const normalizedF = f.divide(f.length()); // Normalize forward vector
        const speed = 1; // Adjust speed as needed

        // Move both eye and at by the forward vector
        this.eye = this.eye.add(normalizedF.divide(1 / speed));
        this.at = this.at.add(normalizedF.divide(1 / speed));
    }

    // Move the camera backward
    moveBack() {
        const f = this.eye.subtract(this.at); // Backward vector
        const normalizedF = f.divide(f.length()); // Normalize backward vector
        const speed = 1; // Adjust speed as needed

        // Move both eye and at by the backward vector
        this.eye = this.eye.add(normalizedF.divide(1 / speed));
        this.at = this.at.add(normalizedF.divide(1 / speed));
    }

    // Move the camera left
    moveLeft() {
        const f = this.eye.subtract(this.at); // Forward vector (reversed)
        const normalizedF = f.divide(f.length()); // Normalize forward vector
        const s = normalizedF.cross(this.up); // Side vector (left)
        const normalizedS = s.divide(s.length()); // Normalize side vector
        const speed = 0.5; // Adjust speed as needed

        // Move both eye and at by the side vector
        this.eye = this.eye.add(normalizedS.divide(1 / speed));
        this.at = this.at.add(normalizedS.divide(1 / speed));
    }

    // Move the camera right
    moveRight() {
        const f = this.eye.subtract(this.at); // Forward vector (reversed)
        const normalizedF = f.divide(f.length()); // Normalize forward vector
        const s = this.up.cross(normalizedF); // Side vector (right)
        const normalizedS = s.divide(s.length()); // Normalize side vector
        const speed = 0.5; // Adjust speed as needed

        // Move both eye and at by the side vector
        this.eye = this.eye.add(normalizedS.divide(1 / speed));
        this.at = this.at.add(normalizedS.divide(1 / speed));
    }

    // Pan the camera left
    panLeft(alpha) {
        const f = this.at.subtract(this.eye); // Forward vector (at - eye)
        const rotationMatrix = new Matrix4(); // Create a rotation matrix
        rotationMatrix.setRotate(alpha, this.up.x, this.up.y, this.up.z); // Rotate around the up vector

        // Rotate the forward vector
        const f_prime = multiplyVector3(rotationMatrix, f);

        // Update the "at" vector
        this.at = this.eye.add(f_prime);
    }

    // Pan the camera right
    panRight(alpha) {
        const f = this.at.subtract(this.eye); // Forward vector (at - eye)
        const rotationMatrix = new Matrix4(); // Create a rotation matrix
        rotationMatrix.setRotate(-alpha, this.up.x, this.up.y, this.up.z); // Rotate around the up vector

        // Rotate the forward vector
        const f_prime = multiplyVector3(rotationMatrix, f);

        // Update the "at" vector
        this.at = this.eye.add(f_prime);
    }

    // Tilt the camera up/down
    tiltUp(alpha) {
        const f = this.at.subtract(this.eye); // Forward vector (at - eye)
        const right = f.cross(this.up).normalize(); // Right vector
        const rotationMatrix = new Matrix4(); // Create a rotation matrix
        rotationMatrix.setRotate(-alpha, right.x, right.y, right.z); // Rotate around the right vector

        // Rotate the forward vector
        const f_prime = multiplyVector3(rotationMatrix, f);

        // Update the "at" vector
        this.at = this.eye.add(f_prime);

        // Recompute the up vector to avoid distortion
        this.up = right.cross(f_prime).normalize();
    }
}
