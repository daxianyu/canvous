import Scheduler from '../Scheduler';
import TwoDArray from '../base/2dArray';

const defaultCoordinateTransformation = (point) => point;
const defaultGetPath = (data) => data.path;
const defaultGetPathStyle = () => {
  return {
    lineWidth: 1,
    strokeStyle: 'rgba(255,217,0,1)',
  };
};

class Paths extends Scheduler {
  constructor(ctx, options) {
    const {
      data,
      coordinateTransformation = defaultCoordinateTransformation,
      getPath = defaultGetPath,
      getPathStyle = defaultGetPathStyle,
      lazy = true,
    } = options;
    super({ data: new TwoDArray(data), lazy });
    this.ctx = ctx;
    this.getPath = getPath;
    this.getPathStyle = getPathStyle;
    this.coordinateTransformation = coordinateTransformation;
  }

  setOptions = (options) => {
    const {
      coordinateTransformation = this.coordinateTransformation,
      getPath = this.getPath,
      getPathStyle = this.getPathStyle,
      data,
    } = options;
    if (data && data !== this.data) {
      this.data = new TwoDArray(data);
    }
    this.coordinateTransformation = coordinateTransformation;
    this.getPath = getPath;
    this.getPathStyle = getPathStyle;
    this.start();
  };

  dataHandler(index, data) {
    this.drawerLine(
      this.getPath(data).map(this.coordinateTransformation),
      this.getPathStyle(data),
    );
  }

  drawerLine(points, pathStyle) {
    const { lineWidth, strokeStyle } = pathStyle;
    const { ctx } = this;
    if (!points.length) return;
    ctx.beginPath();
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i += 1) {
      ctx.lineTo(...points[i]);
    }
    ctx.stroke();
  }

  render() {
    const { width, height } = this.ctx.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.start();
  }
}

export default Paths;
