/**
 * Given two points, return midperpandicular func
 * */
export function getMidperpandicular(point1, point2) {
  let { x1, y1 } = point1;
  let { x2, y2 } = point2;
  if (Array.isArray(point1)) {
    x1 = point1[0];
    y1 = point1[1];
  }
  if (Array.isArray(point2)) {
    x2 = point2[0];
    y2 = point2[1];
  }

  if (x1 === x2 && y1 === y2) {
    throw new Error('Points should not be same!');
  }

  const stringLength = ((x1 - x2) ** 2 + (y1 - y2) ** 2) ** 0.5;
  if (x1 === x2) {
    return function getCenters(rate) {
      if (rate > 2 || rate < 0) {
        throw new Error('Rate of L/R should not larger than 2 or small than 0');
      }
      const y = (y1 + y2) / 2;
      const R = stringLength / rate;
      const distance = (R ** 2 - (stringLength / 2) ** 2) ** 0.5;
      return {
        centers: [[x1 - distance, y], [x1 + distance, y]],
        radius: R,
      };
    };
  }

  if (y1 === y2) {
    return function getCenters(rate) {
      if (rate > 2 || rate < 0) {
        throw new Error('Rate of L/R should not larger than 2 or small than 0');
      }
      const x = (x1 + x2) / 2;
      const R = stringLength / rate;
      const distance = (R ** 2 - (stringLength / 2) ** 2) ** 0.5;
      return {
        centers: [[x, y1 - distance], [x, y1 + distance]],
        radius: R,
      };
    };
  }

  /**
   * point1-center relation and point2-center relation
   * (x - x1)^2 + (y - y1)^2 = (x - x2)^2 + (y - y2) ^ 2
   * we obtain relationship: x + ky = c
   * */
  const c = (x2 ** 2 - x1 ** 2 + y2 ** 2 - y1 ** 2) / (2 * (x2 - x1));
  const k = (y1 - y2) / (x1 - x2);
  /**
   * With Simultaneous equations of circle function
   * and point-center distance, we get another function Ay^2 + By + C = 0
   * */
  const A = (k ** 2 + 1);
  const B = 2 * (x1 * k - c * k - y1);

  /* L/R rate */
  return function getCenters(rate) {
    if (rate > 2 || rate < 0) {
      throw new Error('Rate of L/R should not larger than 2 or small than 0');
    }
    // TODO: rate = 0 to draw line;
    const R = stringLength / rate;
    const C = x1 ** 2 + y1 ** 2 - 2 * c * x1 + c ** 2 - R ** 2;
    const partOfRoot = (B ** 2 - 4 * A * C) ** 0.5;
    const y = (-B + partOfRoot) / (2 * A);
    const x = c - k * y;
    const ySharp = (-B - partOfRoot) / (2 * A);
    const xSharp = c - k * ySharp;
    return {
      centers: [[x, y], [xSharp, ySharp]],
      radius: R,
    };
  };
}

export function getRadOfVector(vector) {
  const [x, y] = vector;
  const stringLength = (x ** 2 + y ** 2) ** 0.5;
  const rad = Math.asin(y / stringLength);
  if (x >= 0 && y >= 0) {
    return rad;
  }
  if (x <= 0 && y >= 0) {
    return Math.PI - rad;
  }
  if (x <= 0 && y <= 0) {
    return Math.PI - rad;
  }
  return 2 * Math.PI + rad;
}
