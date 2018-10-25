const invariant = require('invariant');

/* class for render grid with or without border */
export default class CanvasGrid {
  constructor(ctx, useCache = true) {
    this.imageCache = {};
    this.ctx = ctx;
    this.useCache = useCache;
  }

  /**
   * render single square
   * */
  renderer(x, y, width, height, color, lineColor, rate) {
    const { ctx, imageCache, useCache } = this;
    width = Math.ceil(width * rate);
    if (!width) return;
    if (imageCache[color + width] && useCache) {
      const cache = imageCache[color + width];
      ctx.putImageData(cache, x, y);
    } else {
      ctx.fillStyle = color;
      if (lineColor) {
        ctx.clearRect(x, y, width, height);
        ctx.strokeStyle = lineColor;
        ctx.strokeRect(x, y, width, height);
      }
      ctx.fillRect(x, y, width, height);
      if (useCache) {
        // save image fragment
        imageCache[color + width] = ctx.getImageData(x, y, width, height);
      }
    }
  }

  /**
   * render grid of squares
   * points format:
   * 1. point: [{x, y}, {x, y}] leftBottom vs rightTop
   * 2. color: bg color
   * 3. rate: rect width percentage
   * 4. borderColor: outline color
   * */
  groupRender(pointList, useCache) {
    if (arguments.length > 1) {
      this.useCache = useCache;
    }
    pointList.forEach(points => {
      const { color, rate = 1, point, borderColor } = points;
      invariant(color, 'color must required');
      const {bottomLeft, topRight} = point;
      invariant(bottomLeft, 'point must have prop bottomLeft');
      invariant(topRight, 'point must have prop topRight');
      const { x, y: y0 } = bottomLeft;
      const { x: x0, y } = topRight;
      const width = Math.abs(x0 - x);
      const height = Math.abs(y - y0);
      this.renderer(x, y, width * rate, height, color, borderColor, rate);
    });
  }
}
