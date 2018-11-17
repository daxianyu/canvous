import TwoDArray from '../base/2dArray';

const SPEED_MULTIPLE = 1.2;
/**
 * For mass data scheduling
 * lifeCycle:
 * constructor / start / pause / continue
 * */
export default class Scheduler {
  constructor(options) {
    const { data, lazy = true } = options;
    if (!(data instanceof TwoDArray)) {
      throw new Error('Prop data required to be instanceOf TwoDArray!');
    }
    /* All data, mark item by cursor */
    this.data = data;
    this.cursor = 0;
    this.lazy = lazy;
    this.idleHandler = undefined;
  }

  /** Loop */
  loopStack() {
    this.idleHandler = window.requestIdleCallback(this.runInRequestIdle);
  }

  /** drawing */
  runInRequestIdle = (deadLine) => {
    /**
     * It render this point or not, only this point, other points wil render.
     * It stop render or not, not only this point, also next points.
     * */
    const {
      data, cursor,
    } = this;
    let shouldRender = true;
    let shouldStopDraw = false;
    const totalLength = data.length;
    if (cursor > totalLength) return;

    /* Compare time every time after drawn */
    const timeLeft = deadLine.timeRemaining();
    let current = cursor;
    /* Record cost time and drawn points */
    const start = Date.now();
    let cost = 0;
    while (current < totalLength) {
      /* If not time left, return */
      if (cost > timeLeft / SPEED_MULTIPLE && this.lazy) {
        break;
      }
      /* Get raw point by method of TwoDArray, then convert it to deliver to drawer */
      const point = data.peep(current);
      /* User can control if should render or not */
      if (this.shouldScheduleRender) {
        shouldRender = this.shouldScheduleRender(current, point);
      }
      if (this.shouldScheduleStop) {
        const shouldStop = this.shouldScheduleStop(current, point);
        if (shouldStop) {
          shouldStopDraw = true;
        }
      }
      if (shouldRender && !shouldStopDraw) {
        this.dataHandler(current, point);
      }
      current += 1;
      cost = Date.now() - start;
    }
    this.cursor = current;
    /* Stop loop when finished */
    if (shouldStopDraw) return;
    this.loopStack();
  };

  dataHandler(index, point) {
    //
  }

  start() {
    this.cursor = 0;
    this.continue();
  }

  continue() {
    this.pause();
    this.loopStack();
  }

  pause() {
    if (this.idleHandler) {
      window.cancelIdleCallback(this.idleHandler);
      this.idleHandler = undefined;
    }
  }
}
