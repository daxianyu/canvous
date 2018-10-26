const invariant = require('invariant');
const { kdTree } = require('./kdTree')
/**
 * draw mass points without blockƒ
 * */
export default class Points {

  constructor(dataList, drawer) {
    invariant(
      Array.isArray(dataList),
      'DataList should be array'
    )
    // invariant(
    //   typeof drawer === "function",
    //   'Parameter drawer should be function'
    // )

    this.cursor = 0

    this.processedDataList = this.generateBinaryData(dataList)
    this.drawer = drawer
  }

  /** indicate the index of points data array */
  cursor = 0

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
    // if pause, stop and quit
    if(this.pause) return;

    const { processedDataList, cursor } = this
    const endIndex = processedDataList.length
    if(cursor > endIndex) return

    const timeLeft = deadLine.timeRemaining()
    const count = Math.floor(timeLeft) * 256
    // const pointArr = processedDataList.slice(cursor, count)
    let current = cursor
    while(current < endIndex && current < cursor + count) {
      this.drawer && this.drawer(processedDataList[current])
      current += 1
    }
    this.cursor = current
    // do drawing

    this.loopStack()
  }

  /** start or stop loop */
  start = (fn) => {
    if(fn) {
      this.drawer = fn
    }
    this.pause = false
    this.loopStack()
  }

  stop = () => {
    this.pause = true
  }

  restart = (fn) => {
    this.cursor = 0;
    if(this.pause) {
      this.pause = false
      this.loopStack()
    }
  }

  /** loop */
  loopStack () {
    window.requestIdleCallback(this.drawRouteInRequestIdle)
  }

  /** generate kdTree data and rearrange to binaryHeap */
  generateBinaryData (dataList) {
    const kdData = new kdTree(dataList, function (a, b) {
      return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
    }, ['x', 'y'])
    const stack = [kdData.root]
    let newDataListArray = []
    while(stack.length) {
      const node = stack.shift()
      if (node.left) {
        stack.push(node.left)
      }
      newDataListArray.push(node.obj)
      if(node.right) {
        stack.push(node.right)
      }
    }
    return newDataListArray
  }d
}
