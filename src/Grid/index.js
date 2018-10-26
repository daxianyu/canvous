const invariant = require('invariant');

/* Class for render grid with or without border. */
export default class Grid {
  constructor(ctx, useCache = true) {
    this.imageCache = {};
    this.ctx = ctx;
    this.useCache = useCache;
  }

  /* Render single square. */
  renderer(x, y, width, height, color, lineColor) {
    const { ctx, imageCache, useCache } = this;
    /* Skip if any one of width or height is 0. */
    if (!width) return;
    if (!height) return;
    /* Grids have the same width, height, color and lineColor will be reused. */
    const cacheKey = `${width},${height},${color},${lineColor},`;
    if (imageCache.hasOwnProperty(cacheKey) && useCache) {
      /* Use cached image. */
      const cache = imageCache[cacheKey];
      ctx.putImageData(cache, x, y);
    } else {
      /* Call canvas api to draw grid. */
      ctx.fillStyle = color;
      if (lineColor) {
        ctx.clearRect(x, y, width, height);
        ctx.strokeStyle = lineColor;
        ctx.strokeRect(x, y, width, height);
      }
      ctx.fillRect(x, y, width, height);
      if (useCache) {
        /* Save image in cache. */
        imageCache[cacheKey] = ctx.getImageData(x, y, width, height);
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
   * grid format:
   * 1. bounds: {bottomLeft: {x, y}, topRight: {x, y}}.
   * 2. borderColor: outline colour.
   * 3. color: background colour.
   * */
  groupRender(grids, useCache) {
    if (arguments.length > 1) {
      this.useCache = useCache;
    }
    /* Iterate to draw every single grid. */
    grids.forEach((grid) => {
      const {
        bounds = {},
        borderColor = 'black',
        color = 'black',
      } = grid;
      const { bottomLeft, topRight } = bounds;
      invariant(bottomLeft, 'bounds must have prop bottomLeft');
      invariant(topRight, 'bounds must have prop topRight');
      /**
       * Assume topLeft bound point as (x0, y0), bottomRight bound point as (x1, y1).
       * BottomLeft and topRight bound points coordinates.
       */
      const { x: x0, y: y1 } = bottomLeft;
      const { x: x1, y: y0 } = topRight;
      /* Decimal point would raise performance and platform consistency issues on canvas. */
      const width = Math.round(x1 - x0);
      const height = Math.round(y1 - y0);
      this.renderer(x, y, width, height, color, borderColor);
    });
  }
}
