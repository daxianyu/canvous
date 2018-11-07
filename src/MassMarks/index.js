import invariant from 'invariant';
import { kdTree as KdTree } from 'kd-tree-javascript';
import TdArray from './2dArray';

const MAXSIZE = 30000;

// 13 layers
const MAX_NEAREST_COUNT = (2 ** 13) - 1;

/** Default small, auto increase */
const DEFAULT = 16;
const SMOOTH = 128;
const FAST = 512;

const SPEED = {
  FAST,
  DEFAULT,
  SMOOTH,
};

function pointConvert(point) {
  return point;
}

function kdDistance(a, b) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

/**
 * Draw mass points without block
 * */
export default class MassMarks {
  constructor(ctx, options) {
    const {
      data, drawer, speed, distance, dimension, pointConverter, useKd = true, layer = -1, radius = 1,
    } = options;
    invariant(
      Array.isArray(data),
      'Data should be array',
    );
    /** Canvas context */
    this.ctx = ctx;
    /** Point List data */
    this.$$data = data;
    /** If set point list in kd-tree */
    this.$$useKd = useKd;
    /** Set max layers of points
     * 1 layer: 1 point
     * 2 layer: 1 + 2 points
     * 3 layer: 1 + 2 + 4 + points
     * ...
     *  */
    this.$$layer = layer;
    /** Point radius */
    this.$$radius = radius;
    /** Point drawer */
    this.$$drawer = drawer || this.drawer;
    /** Kd-tree distance method */
    this.$$distance = distance || kdDistance;
    /** Kd-tree dimension */
    this.$$dimetions = dimension || ['x', 'y'];
    /** Point converter */
    this.$$pointConverter = pointConverter || pointConvert;
    /** Draw speed: points draw in 1ms, default auto */
    this.setSpeed(speed);
    if (useKd) {
      this.$$processedDataList = this.$$generateBinaryData(data);
    } else {
      this.$$processedDataList = MassMarks.$$generateNormalData(data);
    }
    /**
     * start draw points
     * */
    this.render();

    this.offscreenGrid = window.document.createElement('canvas');
    this.offscreenCtx = this.offscreenGrid.getContext('2d');
  }

  $$kdTree = null;

  /** Max layers of drawing points tree, -1 for no limit */
  $$layer = -1;

  /** Idle callback handler */
  $$idleHandler = undefined;

  /** indicate the index of points data array */
  $$cursor = 0;

  /** save data in kdTree format */
  $$processedDataList = [];

  /** drawer
   * Draw point in canvas
   * */
  drawer = (point) => {
    const { x, y, fillColor = this.ctx.fillStyle, radius: pRadius } = point;
    const lastFillColor = this.ctx.fillStyle;
    const radius = pRadius || point.radius || this.$$radius;
    this.drawPointOnScreen(x, y, radius, fillColor);
    this.ctx.fillStyle = lastFillColor;
  };

  $$useCache = true

  imageCache = {}

  drawPointOnScreen(x, y, radius, color) {
    const { ctx, imageCache, $$useCache } = this;
    if (!radius) return;
    /* Grids have the same width, height, color and borderColor will be reused. */
    const cacheKey = `${radius},${color}`;
    if ($$useCache && imageCache.hasOwnProperty(cacheKey)) {
      /* Use cached image. */
      const cache = imageCache[cacheKey];
      ctx.putImageData(cache, x, y);
    } else {
      /**
       * Draw offscreenGrid so that a full grid image will be created even though
       * it isn't visible on screen.
       */
      const pointImage = this.drawOffscreenGrid(radius, color);
      ctx.putImageData(pointImage, x, y);
      if ($$useCache) {
        /* Save image in cache. */
        imageCache[cacheKey] = pointImage;
      }
    }
  }

  drawOffscreenGrid(radius, fillColor) {
    const canvas = this.offscreenGrid;
    const ctx = this.offscreenCtx;
    const width = radius * 2;
    /* Clear canvas and adjust the size appropriate to the grid. */
    canvas.width = width;
    canvas.height = width;
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    ctx.arc(radius, radius, radius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
    const imageData = ctx.getImageData(0, 0, width, width);
    const data = imageData.data;
    for (let i = 0; i < width ** 2; i += 1) {
      const y = Math.floor(i / width);
      const x = i % width;
      if (Math.abs(y - radius) ** 2 + Math.abs(x - radius) ** 2 > radius ** 2) {
        data[i * 4] = 0;
        data[i * 4 + 1] = 0;
        data[i * 4 + 2] = 0;
        data[i * 4 + 3] = 0;
      }
    }
    return imageData;
  }

  /** drawing */
  $$drawRouteInRequestIdle = (deadLine) => {
    const {
      $$processedDataList: dataList, $$cursor, $$speed, $$layer, $$isAutoSpeed,
    } = this;
    let shouldStopDraw = false;
    const totalLength = dataList.length;
    if ($$cursor > totalLength) return;

    /** Compare time every time after drawn */
    const timeLeft = deadLine.timeRemaining();
    const count = Math.ceil(timeLeft * $$speed);

    let current = $$cursor;

    /** Record cost time and drawn points */
    const start = Date.now();
    let increment;
    let cost = 0;
    while (current < totalLength) {
      if (!$$isAutoSpeed) {
        if (current < $$cursor + count) {
          break;
        }
      } else if (cost * 1.5 > timeLeft) {
        break;
      }
      /** Layer restrict */
      if ($$layer > -1) {
        if (current > ((2 ** $$layer) - 1)) {
          shouldStopDraw = true;
          break;
        }
      }
      /** Get raw point, then convert it to deliver to drawer */
      let point = dataList.peep(current);
      point = this.$$pointConverter(point);
      this.$$drawer(point);
      current += 1;
      cost = Date.now() - start;
    }
    if (current === totalLength) {
      shouldStopDraw = true;
    }
    if ($$isAutoSpeed) {
      /** Calculate actual speed and adjust it if slow or fast */
      cost = Date.now() - start;
      increment = current - this.$$cursor;
      /** Avoid 0 cause err */
      if (cost > 0) {
        const averageDrawSpeed = increment / cost;
        this.$$speed = Math.ceil(averageDrawSpeed);
      }
    }
    this.$$cursor = current;
    /** Stop loop when finished */
    if (shouldStopDraw) return;
    this.$$loopStack();
  };

  /** pause < continue < render */
  /** start or stop loop */
  pause() {
    if (this.$$idleHandler) {
      window.cancelIdleCallback(this.$$idleHandler);
      this.$$idleHandler = undefined;
    }
  }

  continue(fn) {
    if (fn) {
      this.$$drawer = fn;
    }
    this.pause();
    this.$$loopStack();
  }

  render(fn) {
    this.$$cursor = 0;
    this.continue(fn);
  }

  /** Reset speed */
  setSpeed(speed) {
    this.$$isAutoSpeed = (speed === undefined);
    if (speed !== undefined) {
      if (typeof speed === 'string') {
        this.$$speed = SPEED[speed.toUpperCase()] || DEFAULT;
      }
      if (typeof speed === 'number') {
        this.$$speed = speed;
      }
    } else {
      // auto init speed
      this.$$speed = DEFAULT;
    }
  }

  /**
   * Set options and restart render
   * every time it resets, it will be reRendered
   * @param {object} options
   * */
  setOptions(options) {
    const {
      data, layer = this.$$layer,
      drawer = this.$$drawer, speed, useKd = this.$$useKd,
      radius = this.$$radius, distance = this.$$distance, dimension = this.$$dimetions,
    } = options;
    this.$$dimetions = dimension;
    this.$$distance = distance;
    this.$$radius = radius;
    this.$$layer = layer;
    this.$$drawer = drawer;
    if (speed !== undefined) {
      this.setSpeed(speed);
    }
    if (data && this.$$data !== data) {
      this.$$data = data;
      invariant(
        Array.isArray(data),
        'DataList should be array',
      );
      if (useKd) {
        this.$$processedDataList = this.$$generateBinaryData(data);
      } else {
        this.$$processedDataList = MassMarks.$$generateNormalData(data);
      }
    }
    if (drawer) {
      invariant(
        typeof drawer === 'function',
        'Parameter drawer should be function',
      );
      this.$$drawer = drawer;
    }
    this.render();
  }

  /**
   * Get nearest points
   * @param {object} center
   * @param {number} distance in range of
   * @param {number} count
   * */
  getNearest(center, distance, count = MAX_NEAREST_COUNT) {
    invariant(
      this.$$useKd,
      'Only support when useKd is True',
    );
    if (this.$$kdTree) {
      return this.$$kdTree.nearest(center, count, distance);
    }
    return [];
  }

  /** Loop */
  $$loopStack() {
    this.$$idleHandler = window.requestIdleCallback(this.$$drawRouteInRequestIdle);
  }

  /** Random data arrange if not use kd-tree
   * @param {array} dataList raw data
   * */
  static $$generateNormalData (dataList) {
    if (!dataList.length) {
      return new TdArray();
    }
    const newDataListArray = dataList.slice();
    newDataListArray.sort(() => (Math.random() - 0.5));
    return new TdArray(newDataListArray);
  }

  /** Travel tree to generate array */
  static travelKdTree(kdTree) {
    const stack = new TdArray([kdTree.root], MAXSIZE);
    const listArraySet = new TdArray();
    // 2-d array

    // convert tree to binary heap
    while (stack.length) {
      // if stack is empty, exit
      const node = stack.shift();
      if (node.left) {
        stack.push(node.left);
      }
      listArraySet.push(node.obj);
      if (node.right) {
        stack.push(node.right);
      }
    }
    return listArraySet;
  }

  /** generate kdTree data and rearrange to binaryHeap */
  $$generateBinaryData(dataList) {
    if (!dataList.length) {
      return new TdArray();
    }
    const kdTree = new KdTree(dataList, this.$$distance, this.$$dimetions);
    this.$$kdTree = kdTree;
    return MassMarks.travelKdTree(kdTree);
  }
}
