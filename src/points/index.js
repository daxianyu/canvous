const invariant = require('invariant');
const { kdTree } = require('./kdTree')
const MAXSIZE = 30000
/**
 * draw mass points without blockƒ
 * */
export default class Points {

  constructor(dataList, drawer) {
    invariant(
      Array.isArray(dataList),
      'DataList should be array'
    )
    invariant(
      typeof drawer === "function",
      'Parameter drawer should be function'
    )

    this.processedDataList = this.generateBinaryData(dataList)
    this.drawer = drawer
  }

  /** indicate the index of points data array */
  cursor = 0

  /** start or stop render */
  pause = false

  /** save data in kdTree format */
  processedDataList = []

  /** drawing */
  drawRouteInRequestIdle = (deadLine) => {
    // if pause, stop and quit
    if(this.pause) return;

    const { processedDataList, cursor } = this
    const endIndexOut = processedDataList.length
    // if outer length is 0, empty
    if(endIndexOut === 0) return
    // last array length
    const endIndexLast = processedDataList[endIndexOut - 1].length
    // total count
    const endIndex = (endIndexOut - 1) * MAXSIZE + endIndexLast

    if(cursor > endIndex) return

    const timeLeft = deadLine.timeRemaining()
    const count = Math.floor(timeLeft) * 256
    let current = cursor

    while(current < endIndex && current < cursor + count) {
      const currentOut = Math.floor(current / MAXSIZE)
      const tailIndex = current - currentOut * MAXSIZE
      const point = processedDataList[currentOut][tailIndex]
      this.drawer && this.drawer({
        x: point[0],
        y: point[1]
      })
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
    let firstStack = [kdData.root]
    let currentStack = firstStack
    const stack = [firstStack]

    // 2-d array
    let newDataListArray = []
    const listArraySet = [newDataListArray]

    // convert tree to binary heap
    while(stack.length && firstStack && firstStack.length) {
      // if stack is empty, exit
      const node = firstStack.shift()
      if(firstStack.length === 0 && stack.length > 1) {
        stack.shift()
        firstStack = stack[0]
      }
      if(currentStack.length > MAXSIZE) {
        currentStack = []
        stack.push(currentStack)
      }
      if (node.left) {
        currentStack.push(node.left)
      }
      if(newDataListArray.length >= MAXSIZE) {
        newDataListArray = []
        listArraySet.push(newDataListArray)
      }
      // save as array
      const {x, y} = node.obj
      newDataListArray.push([x, y])
      if(node.right) {
        currentStack.push(node.right)
      }
    }
    return listArraySet
  }
}
