const invariant = require('invariant');
const { kdTree: KdTree } = require('kd-tree-javascript')
const MAXSIZE = 30000;

// 13 layers
const MAX_NEAREST_COUNT = (1 << 12) - 1;

const FAST = 512
const DEFAULT = 256
const SMOOTH = 128

const SPEED = {
  FAST,
  DEFAULT,
  SMOOTH
}

/**
 * draw mass points without block
 * */
export default class MassMarks {

  constructor(dataList, drawer, {
    speed = 'default',
    useKd = false,
    layer = -1
  }) {
    invariant(
      Array.isArray(dataList),
      'DataList should be array'
    )
    invariant(
      typeof drawer === "function",
      'Parameter drawer should be function'
    )
    this.speed = DEFAULT
    if(speed !== undefined) {
      if(typeof speed === 'string') {
        this.speed = SPEED[speed.toUpperCase()] || DEFAULT
      }
      if(typeof speed === 'number') {
        this.speed = speed
      }
    }
    if(useKd) {
      this.processedDataList = this.generateBinaryData(dataList)
    } else {
      this.processedDataList = this.generateNormalData(dataList)
    }
    this.layer = layer
    this.drawer = drawer
    this.start()
  }

  kdTree = null

  /** saving Glancing array */
  glancingDataList = null

  /** max layers of drawing points tree, -1 for no limit */
  layer = -1

  /** start or stop render */
  pause = false

  /** indicate the index of points data array */
  cursor = 0

  /** save data in kdTree format */
  processedDataList = []

  /** drawing */
  drawRouteInRequestIdle = (deadLine) => {
    // if pause, stop and quit
    if(this.pause) return;
    const { processedDataList, glancingDataList, cursor, speed, layer } = this
    // if glancingDataList exist, render it first
    let dataList = processedDataList
    if(glancingDataList) {
      dataList = glancingDataList
    }
    const endIndexOut = dataList.length
    // if outer length is 0, empty
    if(endIndexOut === 0) return
    // last array length
    const endIndexLast = dataList[endIndexOut - 1].length
    // total count
    const endIndex = (endIndexOut - 1) * MAXSIZE + endIndexLast

    if(cursor > endIndex) return

    const timeLeft = deadLine.timeRemaining()
    const count = Math.floor(timeLeft) * speed
    let current = cursor

    while(current < endIndex && current < cursor + count) {
      if(layer > -1) {
        if (current > ((1 << layer) - 1)) break;
      }
      const currentOut = Math.floor(current / MAXSIZE)
      const tailIndex = current - currentOut * MAXSIZE
      const point = dataList[currentOut][tailIndex]
      this.drawer && this.drawer(point)
      current += 1
    }
    this.cursor = current
    // do drawing

    this.loopStack()
  }

  /** start or stop loop */
  start(fn) {
    if(fn) {
      this.drawer = fn
    }
    this.pause = false
    this.loopStack()
  }

  setLayer = (layer) => {
    this.layer = layer || -1
  }

  stop() {
    this.pause = true
  }

  restart(fn) {
    this.cursor = 0;
    this.glancingDataList = null;
    if(this.pause) {
      this.pause = false
      this.loopStack()
    }
  }

  /** lookup nearest point to draw */
  lookUp(center, distance) {
    if (this.kdTree) {
      const nearest = this.kdTree.nearest(center, MAX_NEAREST_COUNT, distance)
      this.glancingDataList  = [nearest.map(point => {
        return point[0]
      })];
    }
    this.cursor = 0;
    if(this.pause) {
      this.pause = false;
      this.loopStack()
    }
  }

  /** stop glancing */
  stopLookUp() {
    this.glancingDataList = null
    this.restart()
  }

  /** loop */
  loopStack () {
    window.requestIdleCallback(this.drawRouteInRequestIdle)
  }

  /** random data arrange */
  generateNormalData (dataList) {
    if(!dataList.length) {
      return []
    }
    // 2-d array
    let newDataListArray = dataList.slice()
    newDataListArray.sort(() => (Math.random() - 0.5))
    return [newDataListArray]
  }

  /** travel tree to generate array */
  static travelKdTree(kdTree) {
    let firstStack = [kdTree.root]
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
      newDataListArray.push(node.obj)
      if(node.right) {
        currentStack.push(node.right)
      }
    }
    return listArraySet
  }


  /** generate kdTree data and rearrange to binaryHeap */
  generateBinaryData(dataList) {
    if(!dataList.length) {
      return []
    }
    const kdTree = new KdTree(dataList, function (a, b) {
      return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
    }, ['x', 'y'])
    this.kdTree = kdTree
    return MassMarks.travelKdTree(kdTree);
  }
}
