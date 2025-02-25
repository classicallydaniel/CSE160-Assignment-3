class Vector {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    // Add another vector to this vector
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    // Subtract another vector from this vector
    subtract(v) {
        return new Vector(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    // Divide this vector by a scalar
    divide(scalar) {
        return new Vector(this.x / scalar, this.y / scalar, this.z / scalar);
    }

    // Compute the length (magnitude) of this vector
    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    // Compute the cross product of this vector with another vector
    cross(v) {
        return new Vector(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        );
    }

    normalize() {
        const len = this.length();
        return this.divide(len);
    }

    toArray() {
        return [this.x, this.y, this.z];
    }
}