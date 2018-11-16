import { getMidperpandicular, getRadOfVector } from './utils';
import Scheduler from '../Scheduler';
import TwoDArray from '../base/2dArray';

export default class Arcs extends Scheduler {
  /**
   * @param {object} ctx - canvas context;
   * @param {object} options: rate: L/R rate;
   * */
  constructor(ctx, options) {
    const { data, coordinateTransformation, rate = 0.5 } = options;
    super({ data: new TwoDArray(data) });
    this.ctx = ctx;
    this.coordinateTransformation = coordinateTransformation;
    this.rate = rate;
  }

  /* Implement Schedule dataHandler */
  dataHandler(index, data) {
    this.drawArcs(data, this.rate);
  }

  drawArc(center, points, radius) {
    const [xc, yc] = center;
    const [point1, point2] = points;
    const [xp1, yp1] = point1;
    const [xp2, yp2] = point2;
    let startAngle = getRadOfVector([xp1 - xc, yp1 - yc]);
    let endAngle = getRadOfVector([xp2 - xc, yp2 - yc]);

    /**
     * Minor arc;
     * */
    if (
      (startAngle > endAngle && startAngle - endAngle < Math.PI)
      || endAngle - startAngle > Math.PI
    ) {
      const temp = startAngle;
      startAngle = endAngle;
      endAngle = temp;
    }
    this.ctx.beginPath();
    this.ctx.arc(xc, yc, radius, startAngle, endAngle);
    this.ctx.stroke();
  }

  drawArcs(points, rate) {
    let [point1, point2] = points;
    /**
     * Transform other unit to x-y;
     * */
    point1 = this.coordinateTransformation(point1)
    point2 = this.coordinateTransformation(point2)
    points = [point1, point2];
    const radiusAndCenters = getMidperpandicular(point1, point2)(rate);
    /* With two points and one radius, we can obtain two circles */
    const { centers, radius } = radiusAndCenters;
    const [c1, c2] = centers;
    this.drawArc(c1, points, radius);

    if (Math.random() > 0.5) {
      this.drawArc(c1, points, radius);
    } else {
      this.drawArc(c2, points, radius);
    }
  }
}
