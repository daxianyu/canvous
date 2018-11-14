const invariant = require('invariant');

/**
 * Default coordinate transformation doesn't do anything.
 */
function defaultCoordinateTransformation(coordinate) {
  return coordinate;
}

/* Class to render grid with or without border. */
export default class Grid {
  constructor(ctx, options) {
    const {
      coordinateTransformation = defaultCoordinateTransformation,
      data = [],
      useCache = true,
    } = options;

    /**
     * Coordinate transformation will be executed just before calling canvas api.
     * In most cases, coordinates (bounds for Grid) should have values in pixel, and it is not
     * necessary to transform coordinates. However, in some rare cases, performing coordinate
     * transformation here could bring notable performance improvement. Assume coordinates (bounds)
     * are defined in terms of lngLat, and it won't change ever since. Everytime user zooms or drag
     * map, one should loop through coordinates, perform coordinate transformation and feed Grid
     * with coordinates in pixel. However, if this coordinate transformation could be executed in
     * Grid just before calling canvas api, we boost render performance by escaping a loop.
     */
    this.coordinateTransformation = coordinateTransformation;
    this.ctx = ctx;
    this.data = data;
    this.imageCache = {};
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

  /**
   * reset options
   * @param {object} options
   * */
  setOptions = (options) => {
    const { data = this.data, useCache = this.useCache } = options;
    this.data = data;
    this.useCache = useCache;
  };

  /**
   * Get nearest grid.
   * @param {object | array} point - hover or clicked point;
   * @param {function} callback;
   * @return { number } index - index of grid;
   * */
  getNearestGrid = (point, callback) => {
    let { x, y } = point;
    if (Array.isArray(point)) {
      x = point[0];
      y = point[1];
    }
    for (let i = 0; i < this.data.length; i += 1) {
      const { bounds } = this.data[i];
      const { bottomLeft, topRight } = bounds;
      const { x: x0, y: y1 } = this.coordinateTransformation(bottomLeft);
      const { x: x1, y: y0 } = this.coordinateTransformation(topRight);
      if (x >= x0 && x <= x1 && y >= y0 && y <= y1) {
        callback(i, this.data[i]);
        break;
      }
    }
    callback(-1, null);
  };

  /**
   * Render many grids. Calling this function draws grids.
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
  render = () => {
    const grids = this.data;
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
      const { x: x0, y: y1 } = this.coordinateTransformation(bottomLeft);
      const { x: x1, y: y0 } = this.coordinateTransformation(topRight);
      /* Decimal point would raise performance and platform consistency issues on canvas. */
      const width = Math.round(x1 - x0);
      const height = Math.round(y1 - y0);
      this.drawGridOnScreen(x0, y0, width, height, color, borderColor);
    });
  };

  /* Draw a single grid. */
  drawGridOnScreen(x, y, width, height, color, borderColor) {
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
   * Draw a single grid on an offscreen canvas.
   * The size of the grid should match exactly the size of the canvas.
   */
  drawOffscreenGrid(width, height, color, borderColor) {
    const canvas = this.offscreenGrid;
    const ctx = this.offscreenCtx;
    /* Clear canvas and adjust the size appropriate to the grid. */
    canvas.width = width;
    canvas.height = height;
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
}
