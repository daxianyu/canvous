const invariant = require('invariant');

/* Class to render grid with or without border. */
export default class Grid {
  constructor(ctx, useCache = true) {
    this.imageCache = {};
    this.ctx = ctx;
    this.useCache = useCache;
    /**
     * Every grid will be drawn on offscreen canvas first, then cached if required,
     * and finally copied to the screen canvas.
     * In this way, we could cache the entire grid image even though this grid is not
     * visible on screen. In the circumstance that this cached grid could be reused later,
     * it shows the grid image instead of a blank image.
     */
    this.offscreenGrid = window.document.createElement('canvas');
    this.offscreenCtx = this.offscreenGrid.getContext('2d');
  }

  /* Draw a single grid on a canvas. The size of the grid should match exactly the size of the canvas. */
  drawOffscreenGrid(width, height, color, borderColor) {
    const canvas = this.offscreenGrid;
    const ctx = this.offscreenCtx;
    /* Clear canvas and adjust the size appropriate to the grid. */
    canvas.width = width,
    canvas.height = height,
    /* Call canvas api to draw grid. */
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    /* Draw border if border colour is defined. */
    if (borderColor) {
      ctx.strokeStyle = borderColor;
      ctx.strokeRect(0, 0, width, height);
    }
    return ctx.getImageData(0, 0, width, height);
  }

  /* Render single square. */
  renderer(x, y, width, height, color, borderColor) {
    const { ctx, imageCache, useCache } = this;
    /* Skip if any one of width or height is 0. */
    if (!width || !height) return;
    /* Grids have the same width, height, color and borderColor will be reused. */
    const cacheKey = `${width},${height},${color},${borderColor},`;
    if (useCache && imageCache.hasOwnProperty(cacheKey)) {
      /* Use cached image. */
      const cache = imageCache[cacheKey];
      ctx.putImageData(cache, x, y);
    } else {
      /**
       * Draw offscreenGrid so that a full grid image will be created even though
       * it isn't visible on screen.
       */
      const gridImage = this.drawOffscreenGrid(width, height, color, borderColor);
      ctx.putImageData(gridImage, x, y);
      if (useCache) {
        /* Save image in cache. */
        imageCache[cacheKey] = gridImage;
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
   * @param {string}   [grids[].borderColor] - Grid outline colour.
   * @param {string}   [grids[].color=black] - Grid background colour.
   *
   * grid format:
   * 1. bounds: {bottomLeft: {x, y}, topRight: {x, y}}.
   * 2. borderColor: outline colour.
   * 3. color: background colour.
   * */
  groupRender(grids) {
    /* Iterate to draw every single grid. */
    grids.forEach((grid) => {
      const {
        bounds = {},
        borderColor,
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
      this.renderer(x0, y0, width, height, color, borderColor);
    });
  }
}
