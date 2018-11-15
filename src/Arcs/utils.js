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
    return function (rate) {
      if (rate > 2 || rate < 0) {
        throw new Error('Rate of L/R should not larger than 2 or small than 0');
      }
      const y = (y1 + y2) / 2;
      const R = stringLength / rate;
      const distance = (R ** 2 - (stringLength / 2) ** 2) ** 0.5;
      return [[x1 - distance, y], [x1 + distance, y]];
    };
  }

  if (y1 === y2) {
    return function (rate) {
      if (rate > 2 || rate < 0) {
        throw new Error('Rate of L/R should not larger than 2 or small than 0');
      }
      const x = (x1 + x2) / 2;
      const R = stringLength / rate;
      const distance = (R ** 2 - (stringLength / 2) ** 2) ** 0.5;
      return [[x, y1 - distance], [x, y1 + distance]];
    };
  }

  const c1 = (x2 ** 2 - x1 ** 2 + y2 ** 2 - y1 ** 2) / (2 * (x2 - x1));
  const slope = (y1 - y2) / (x1 - x2);
  const A = (slope ** 2 + 1);
  const B = (2 * x1 * slope - 2 * c1 * slope - 2 * y1);

  /* L/R rate */
  return function(rate) {
    if (rate > 2 || rate < 0) {
      throw new Error('Rate of L/R should not larger than 2 or small than 0');
    }
    // TODO: rate = 0 to draw line;
    const R = stringLength / rate;
    const C = x1 ** 2 - 2 * x1 ** 2 + c1 ** 2 + y1 ** 2 - R ** 2;
    const y = (-B + (B ** 2 - 4 * A * C) ** 0.5) / (2 * A);
    const x = c1 - slope * y;
    return [x, y];
  };
}
