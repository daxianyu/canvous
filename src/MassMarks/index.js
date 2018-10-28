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
    speed,
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
    this.$$speed = DEFAULT
    this.setSpeed(speed)

    if(useKd) {
      this.$$processedDataList = this.$$generateBinaryData(dataList)
    } else {
      this.$$processedDataList = this.$$generateNormalData(dataList)
    }
    this.$$layer = layer
    this.$$drawer = drawer
    this.start()
  }

  $$kdTree = null

  /** saving Glancing array */
  $$glancingDataList = null

  /** max layers of drawing points tree, -1 for no limit */
  $$layer = -1

  /** Idle callback handler */
  $$idleHandler = undefined

  /** indicate the index of points data array */
  $$cursor = 0

  /** save data in kdTree format */
  $$processedDataList = []

  /** drawing */
  $$drawRouteInRequestIdle = (deadLine) => {
    const { $$processedDataList, $$glancingDataList, $$cursor, $$speed, $$layer, $$isAutoSpeed } = this
    let shouldStopDraw = false
    // if glancingDataList exist, render it first
    let dataList = $$processedDataList
    if($$glancingDataList) {
      dataList = $$glancingDataList
    }
    const endIndexOut = dataList.length
    // if outer length is 0, empty
    if(endIndexOut === 0) return
    // last array length
    const endIndexLast = dataList[endIndexOut - 1].length
    // total count
    const endIndex = (endIndexOut - 1) * MAXSIZE + endIndexLast

    if($$cursor > endIndex) return

    const timeLeft = deadLine.timeRemaining()
    const count = Math.floor(timeLeft) * $$speed
    let current = $$cursor

    // record cost time and drawn points
    let start = Date.now(), increment, cost;
    while(current < endIndex && current < $$cursor + count) {
      // layer restrict and not is small scale
      if($$layer > -1 && !$$glancingDataList) {
        if (current > ((1 << $$layer) - 1)) {
          shouldStopDraw = true;
          break;
        }
      }
      const currentOut = Math.floor(current / MAXSIZE)
      const tailIndex = current - currentOut * MAXSIZE
      const point = dataList[currentOut][tailIndex]
      this.$$drawer && this.$$drawer(point)
      current += 1
    }
    if (current === endIndex) {
      shouldStopDraw = true
    }
    if($$isAutoSpeed) {
      cost = Date.now() - start;
      increment = current - this.$$cursor
      // avoid 0 cause err
      if(increment > 0) {
        const averageDrawSpeed = cost / increment;
        this.$$speed = Math.ceil(this.$$speed + averageDrawSpeed * (timeLeft - cost))
      }
    }
    this.$$cursor = current
    // stop loop when finished
    if(shouldStopDraw) return;
    // do drawing
    this.$$loopStack()
  }

  /** stop < start < restart < restartMain */
  /** start or stop loop */
  start(fn) {
    if(fn) {
      this.$$drawer = fn
    }
    this.stop()
    this.$$loopStack()
  }

  stop() {
    if(this.$$idleHandler) {
      window.cancelIdleCallback(this.$$idleHandler)
      this.$$idleHandler = undefined
    }
  }

  restart(fn) {
    this.$$cursor = 0;
    this.start(fn)
  }

  restartMain(fn) {
    this.$$glancingDataList = null;
    this.restart(fn)
  }

  /** change max layer */
  setLayer = (layer) => {
    this.$$layer = layer || -1
    this.restart()
  }

  /** reset speed */
  setSpeed(speed) {
    this.$$isAutoSpeed = (speed === undefined)
    if(speed !== undefined) {
      if(typeof speed === 'string') {
        this.$$speed = SPEED[speed.toUpperCase()] || DEFAULT
      }
      if(typeof speed === 'number') {
        this.$$speed = speed
      }
    } else {
      // auto init speed
      this.$$speed = DEFAULT
    }
  }

  /** lookup nearest point to draw */
  lookUp(center, distance, count = MAX_NEAREST_COUNT) {
    if (this.$$kdTree) {
      const nearest = this.$$kdTree.nearest(center, count, distance)
      this.$$glancingDataList  = [nearest.map(point => {
        return point[0]
      })];
    }
    this.restart()
  }

  /** stop glancing */
  stopLookUp() {
    this.$$glancingDataList = null
    this.restart()
  }

  /** loop */
  $$loopStack = () => {
    this.$$idleHandler = window.requestIdleCallback(this.$$drawRouteInRequestIdle)
  }

  /** random data arrange */
  $$generateNormalData (dataList) {
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
  $$generateBinaryData(dataList) {
    if(!dataList.length) {
      return []
    }
    const kdTree = new KdTree(dataList, function (a, b) {
      return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2)
    }, ['x', 'y'])
    this.$$kdTree = kdTree
    return MassMarks.travelKdTree(kdTree);
  }
}
