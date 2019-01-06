import AsyncScheduler from '../Scheduler/Async';
import { getMidperpandicular, getRadOfVector, getTransformedRadiusAndCenter } from './utils';

const { AnimateSpirit } = AsyncScheduler;

const defaultCoordinateTransformation = (point) => point;

class Animated extends AsyncScheduler {
  constructor(ctx, props) {
    const {
      data = [],
      onAnimate,
      coordinateTransformation = defaultCoordinateTransformation,
      rate = 0.5,
      strokeStyle = 'black',
      onAnimationEnd,
    } = props;
    super({
      data,
      onAnimate,
    });
    this.ctx = ctx;
    this.options = {
      rate,
      strokeStyle,
    };
    this.coordinateTransformation = coordinateTransformation;
    this.generateRelativeCenterAndRadius(rate);
    this.animation.onAnimationEnd = onAnimationEnd;
    this.animation.onFrameStart = () => {
      const { width, height } = ctx.canvas;
      ctx.clearRect(0, 0, width, height);
    };
  }

  generateRelativeCenterAndRadius(rate) {
    /** Generate initial radius and centers,
     * any others could calculate by rotation or translation or scale
     */
    const radiusAndCenters = getMidperpandicular([0, 0], [1, 0])(rate);
    /* With two points and one radius, we can obtain two circles */
    const { centers, radius } = radiusAndCenters;
    this.relativeCenterAndRadius = {
      centers,
      radius,
    };
  }

  /**
   * 如果沿着顺时针方向, 起点需要走大于半圆的路径才能抵达终点, 则为优弧,
   * 如果终点角度小于起点角度, 终点角度加上2π后再计算
   * 如果是优弧, 则转为逆时针(true), 否则为顺时针(false)
   * @param startAngle
   * @param endAngle
   */
  static getArcClockwise(startAngle, endAngle) {
    if (endAngle < startAngle) {
      endAngle += (2 * Math.PI);
    }
    return (endAngle - startAngle > Math.PI);
  }

  /**
   *
   * @param startAngle
   * @param endAngle
   */
  static getDeliveredEndAngle(startAngle, endAngle) {
    if (endAngle < startAngle) {
      endAngle += (2 * Math.PI);
      if (endAngle - startAngle > Math.PI) {
        return endAngle - 2 * Math.PI;
      }
    }
    if (startAngle < endAngle) {
      if (endAngle - startAngle > Math.PI) {
        return endAngle - 2 * Math.PI;
      }
    }
    return endAngle;
  }

  setOptions = (options) => {
    const {
      coordinateTransformation = this.coordinateTransformation,
      data = this.data,
      rate = this.options.rate,
      strokeStyle = this.options.strokeStyle,
    } = options;
    this.data = data;
    this.coordinateTransformation = coordinateTransformation;
    this.options = {
      rate,
      strokeStyle,
    };
    this.generateRelativeCenterAndRadius(rate);
  };

  dataHandler(data, index, next) {
    this.drawArcs(data, index, next);
  }

  drawArc(center, points, radius, index, next) {
    const [xc, yc] = center;
    const [point1, point2] = points;
    const [xp1, yp1] = point1;
    const [xp2, yp2] = point2;
    const startAngle = getRadOfVector([xp1 - xc, yp1 - yc]);
    const endAngle = Animated.getDeliveredEndAngle(
      startAngle, getRadOfVector([xp2 - xc, yp2 - yc]),
    );
    this.animation.addSpirit(new AnimateSpirit({
      from: endAngle,
      to: startAngle,
      onRender: (nextPosition, renderIndex) => {
        this.ctx.beginPath();
        this.ctx.strokeStyle = this.options.strokeStyle;
        this.ctx.arc(
          xc,
          yc,
          radius,
          startAngle,
          nextPosition,
          Animated.getArcClockwise(startAngle, endAngle),
        );
        this.ctx.stroke();
      },
    }));
    next();
  }

  drawArcs(points, index, next) {
    let [point1, point2] = points;
    /**
     * Transform other unit to x-y;
     * */
    point1 = this.coordinateTransformation(point1);
    point2 = this.coordinateTransformation(point2);
    points = [point1, point2];

    /**
     * Calculate tan(theta), judge the 4th char is odd or even.
     * @param p1
     * @param p2
     * @return {number}
     */
    function getRandomWithAngle(p1, p2) {
      const tan = `${(p1[1] - p2[1]) / (p1[0] - p2[0])}`;
      return Number(tan[4]) % 2;
    }
    const { centers, radius } = this.relativeCenterAndRadius;
    /* 只是作为一种随机, 角度!!! */
    if (getRandomWithAngle(point1, point2)) {
      const {
        center,
        radius: transformedRadius,
      } = getTransformedRadiusAndCenter(points, centers[0], radius);
      this.drawArc(center, points, transformedRadius, index, next);
    } else {
      const {
        center,
        radius: transformedRadius,
      } = getTransformedRadiusAndCenter(points, centers[1], radius);
      this.drawArc(center, points, transformedRadius, index, next);
    }
  }

  render() {
    this.start();
  }
}

export default Animated;
