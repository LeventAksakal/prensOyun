<template>
  <div>
    <!-- Your component's HTML template goes here -->
  </div>
</template>

<script>
export class Game {
  constructor({ timer, scoreLimit, canvas}) {
    this.timer = timer;
    this.scoreLimit = scoreLimit;
    this.context = canvas.getContext("2d");
    this.width = canvas.width;
    this.height = canvas.height;
    this.score = 0;
    this.timeRemaining = this.timer;
    this.mouseCoordinates = { x: 0, y: 0 };
    this.canvas = context.canvas;
    this.c = context;
    this.rectangle = new Rectangle({
      position: { x: width / 2, y: height / 2 },
      velocity: { x: 0, y: 0 },
      size: { width: 20, height: 110 },
      color: "gray",
      border: {
        left: 0,
        right: 200,
        top: 0,
        bottom: height,
      },
    });
    this.rectangle2 = new Rectangle({
      position: { x: width / 2, y: height / 2 },
      velocity: { x: 0, y: 0 },
      size: { width: 20, height: 110 },
      color: "gray",
      border: {
        left: width - 200,
        right: width,
        top: 0,
        bottom: height,
      },
    });
    this.ball = new Circle({
      position: { x: width / 2, y: height / 2 },
      velocity: { x: 2, y: 0 },
      radius: 10,
      color: "red",
      border: {
        left: 0,
        right: width,
        top: 0,
        bottom: height,
      },
    });
  }

  update() {
    // Update the game objects
    this.rectangle.update(this.mouseCoordinates);
    this.rectangle2.update(this.mouseCoordinates);
    this.ball.update([this.rectangle, this.rectangle2]);
  }

  animate() {
    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.c.fillStyle = "green";
    this.c.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.rectangle.draw(this.c);
    this.rectangle2.draw(this.c);
    this.ball.draw(this.c);
    this.update();
    window.requestAnimationFrame(() => this.animate());
  }
}
export class Circle {
  constructor({ position, velocity, radius, color, border }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.border = border;
    this.collisionTimer = 0;
    this.collisionDelay = 1000;
    this.maxSpeed = 6;
  }
  draw(c) {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }

  isCollidingWithRectangle(rectangle) {
    const rectanglePosition = rectangle.position;
    const rectangleSize = rectangle.size;
    return (
      this.position.x + this.radius >=
        rectanglePosition.x - rectangleSize.width / 2 &&
      this.position.x - this.radius <=
        rectanglePosition.x + rectangleSize.width / 2 &&
      this.position.y + this.radius >=
        rectanglePosition.y - rectangleSize.height / 2 &&
      this.position.y - this.radius <=
        rectanglePosition.y + rectangleSize.height / 2
    );
  }

  update(rectangles) {
    this.collisionTimer -= 10;
    // Edge control x
    for (let rectangle of rectangles) {
      // Only check for collisions if the collision timer is less than or equal to 0
      if (
        this.collisionTimer <= 0 &&
        this.isCollidingWithRectangle(rectangle)
      ) {
        this.velocity.x = 0.2 * rectangle.velocity.x - this.velocity.x;
        this.velocity.y = 0.2 * rectangle.velocity.y - this.velocity.y;

        // Limit the speed to maxSpeed
        let speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
        if (speed > this.maxSpeed) {
          this.velocity.x = (this.velocity.x / speed) * this.maxSpeed;
          this.velocity.y = (this.velocity.y / speed) * this.maxSpeed;
        }

        // Reset the collision timer
        this.collisionTimer = this.collisionDelay;
      }
    }

    if (
      this.position.x >= this.border.right - this.radius &&
      this.velocity.x > 0
    ) {
      this.position.x = canvas.width / 2;
      this.velocity.x = 2;
      this.velocity.y = 0;
    } else if (
      this.position.x <= this.border.left + this.radius &&
      this.velocity.x < 0
    ) {
      this.position.x = canvas.width / 2;
      this.velocity.x = 2;
      this.velocity.y = 0;
    } else {
      this.position.x += this.velocity.x;
    }
    //Edge control y
    if (
      this.position.y >= this.border.bottom - this.radius &&
      this.velocity.y > 0
    ) {
      this.velocity.y *= -1;
    } else if (
      this.position.y <= this.border.top + this.radius &&
      this.velocity.y < 0
    ) {
      this.velocity.y *= -1;
    } else {
      this.position.y += this.velocity.y;
    }
  }
}
export class Rectangle {
  constructor({ position, velocity, size, color, border }) {
    this.position = position;
    this.velocity = velocity;
    this.size = size; // Changed from radius to size
    this.color = color;
    this.border = border;
  }
  draw(c) {
    c.fillStyle = this.color;
    c.fillRect(
      this.position.x - this.size.width / 2,
      this.position.y - this.size.height / 2,
      this.size.width,
      this.size.height
    );
    c.beginPath();
    c.setLineDash([5, 15]); // Sets the dash pattern
    c.strokeStyle = "black"; // Sets the color of the border
    c.strokeRect(
      this.border.left,
      this.border.top,
      this.border.right - this.border.left,
      this.border.bottom - this.border.top
    );
    c.closePath();
  }

  update(mouseCoordinates) {
    //updates the velocity with respect to cursor position
    this.velocity.x = 0.1 * (mouseCoordinates.x - this.position.x);
    this.velocity.y = 0.1 * (mouseCoordinates.y - this.position.y);

    //Edge control x
    if (
      this.position.x >= this.border.right - this.size.width / 2 &&
      this.velocity.x > 0
    ) {
      this.position.x = this.border.right - this.size.width / 2;
      this.velocity.x = 0;
    } else if (
      this.position.x <= this.border.left + this.size.width / 2 &&
      this.velocity.x < 0
    ) {
      this.position.x = this.border.left + this.size.width / 2;
      this.velocity.x = 0;
    } else {
      this.position.x += this.velocity.x;
    }
    //Edge control y
    if (
      this.position.y >= this.border.bottom - this.size.height / 2 &&
      this.velocity.y > 0
    ) {
      this.position.y = this.border.bottom - this.size.height / 2;
    } else if (
      this.position.y <= this.border.top + this.size.height / 2 &&
      this.velocity.y < 0
    ) {
      this.position.y = this.border.top + this.size.height / 2;
    } else {
      this.position.y += this.velocity.y;
    }
  }
}
</script>

<style scoped>
/* Your component's CSS styles go here */
</style>
