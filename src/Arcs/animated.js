import AsyncScheduler from '../Scheduler/Async';
import {
  getMidperpandicular,
  getRadOfVector,
  getTransformedRadiusAndCenter,
  mapAngleToRangeOf2Pi,
} from './utils';

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
      this.ctx.strokeStyle = this.options.strokeStyle;
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
    let shouldReRender = false;
    if (data !== this.data) {
      this.data = data;
      shouldReRender = true;
    }
    if (coordinateTransformation !== this.coordinateTransformation) {
      shouldReRender = true;
      this.coordinateTransformation = coordinateTransformation;
    }
    if (rate !== this.options.rate) {
      this.options.rate = rate;
      shouldReRender = true;
      this.generateRelativeCenterAndRadius(rate);
    }
    if (strokeStyle !== this.options.strokeStyle) {
      shouldReRender = true;
      this.options.strokeStyle = strokeStyle;
    }
    if (shouldReRender) {
      this.render();
    }
  };

  dataHandler(data, index, next) {
    this.drawArcs(data, index, next);
  }

  /**
   * Only draw the upper part arc of circle.
   * @param center
   * @param points
   * @param radius
   * @param index
   * @param next
   */
  drawUpperArc(center, points, radius, index, next) {
    const [xc, yc] = center;
    const [point1, point2] = points;
    const [xp1, yp1] = point1;
    const [xp2, yp2] = point2;
    const startAngle = getRadOfVector([xp1 - xc, yp1 - yc]);
    const endAngle = Animated.getDeliveredEndAngle(
      startAngle, getRadOfVector([xp2 - xc, yp2 - yc]),
    );

    const averageAngle = mapAngleToRangeOf2Pi((startAngle + endAngle) / 2);
    /* If average degree of Arc is above xAxis, we mark it as upper arc */
    if (averageAngle < Math.PI) {
      return;
    }

    this.animation.addSpirit(new AnimateSpirit({
      from: startAngle,
      to: endAngle,
      onRender: (nextPosition = endAngle, renderIndex) => {
        this.ctx.beginPath();
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

    const { centers, radius } = this.relativeCenterAndRadius;
    const {
      center: center0,
      radius: transformedRadius0,
    } = getTransformedRadiusAndCenter(points, centers[0], radius);
    this.drawUpperArc(center0, points, transformedRadius0, index, next);
    const {
      center: center1,
      radius: transformedRadius1,
    } = getTransformedRadiusAndCenter(points, centers[1], radius);
    this.drawUpperArc(center1, points, transformedRadius1, index, next);
  }

  render() {
    this.start();
  }
}

export default Animated;
