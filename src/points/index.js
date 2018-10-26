const invariant = require('invariant');
const { kdTree } = require('./kdTree')

/**
 * draw mass points without blockƒ
 * */
export default class Points {

  constructor(dataList) {
    invariant(
      Array.isArray(dataList),
      'DataList should be array'
    )
    this.processedDataList = this.generateBinaryData(dataList)
  }

  /**
   * saving waiting points to draw
   */
  stack = []

  /** start or stop render */
  pause = false

  /** save data in kdTree format */
  processedDataList = []

  /** drawing */
  drawRouteInRequestIdle = (deadLine) => {
    // do drawing
    if(!this.pause) {
      this.loopStack()
    }
  }

  /** loop */
  loopStack () {
    window.requestIdleCallback(this.drawRouteInRequestIdle)
  }

  /** generate kdTree data */
  generateBinaryData (dataList) {

  }
}
