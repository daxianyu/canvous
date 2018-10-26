const invariant = require('invariant');

/* Class for render grid with or without border. */
export default class Grid {
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
   * Render many grids.
   * @param {object[]} grids - Represents a list of grids.
   * @param {object}   grids[].bounds - Grid boundary.
   * @param {object}   grids[].bounds.bottomLeft - Grid bottom left point in the coordinate system.
   * @param {number}   grids[].bounds.bottomLeft.x - Grid bottom left point horizontal coordinate value.
   * @param {number}   grids[].bounds.bottomLeft.y - Grid bottom left point vertical coordinate value.
   * @param {object}   grids[].bounds.topRight - Grid top right point in the coordinate system.
   * @param {number}   grids[].bounds.topRight.x - Grid top right point horizontal coordinate value.
   * @param {number}   grids[].bounds.topRight.y - Grid top right point vertical coordinate value.
   * @param {string}   grids[].borderColor - Grid outline colour.
   * @param {string}   grids[].color - Grid background colour.
   * 
   * grids format:
   * 1. bounds: {bottomLeft: {x, y}, topRight: {x, y}}
   * 2. color: background colour
   * 3. rate: rect width percentage
   * 4. borderColor: outline colour
   * */
  groupRender(grids, useCache) {
    if (arguments.length > 1) {
      this.useCache = useCache;
    }
    /* Iterate to draw every single grid. */
    grids.forEach((grid) => {
      const { bounds = {}, borderColor, color, rate = 1 } = grid;
      const { bottomLeft, topRight } = bounds;
      invariant(color, 'color is required');
      invariant(bottomLeft, 'bounds must have prop bottomLeft');
      invariant(topRight, 'bounds must have prop topRight');
      const { x, y: y0 } = bottomLeft;
      const { x: x0, y } = topRight;
      const width = Math.abs(x0 - x);
      const height = Math.abs(y - y0);
      this.renderer(x, y, width * rate, height, color, borderColor, rate);
    });
  }
}
