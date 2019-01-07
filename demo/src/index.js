import { MassMarks, AnimatedArc, MultiLayer } from 'canvous';
import generateArcs from './generateArcs';

const Layer = MultiLayer.Layer;
const container = document.getElementById('app');
const canvas = document.createElement('canvas');
const arcCanvas = document.createElement('canvas');

const labelText = document.createElement('p');
labelText.style.fontSize = '44px';
labelText.style.backgroundColor = 'green';
labelText.style.color = 'red';
document.body.appendChild(labelText);

const size = 1000;

const layerManager = new MultiLayer(container, {
  height: size,
  width: size,
});

const massMarksLayer = new Layer(canvas, {
  fitSize: true,
});

const arcLayer = new Layer(arcCanvas, {
  fitSize: true,
});

layerManager.addLayer(massMarksLayer);
layerManager.addLayer(arcLayer);

const colRowCount = 100;
const radius = (size / colRowCount) / 2.5;
/**
 * @return {Array}
 */
function generateMarkData() {
  const data = [];
  const { width, height } = canvas;
  const colCount = colRowCount;
  const rowCount = colRowCount;
  const gridWidth = width / colCount;
  const gridHeight = height / colCount;
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      const red = Math.ceil(255 - rowIndex * 255 / rowCount).toString(16).padStart(2, '0');
      const green = Math.ceil(255 - colIndex * 255 / colCount).toString(16).padStart(2, '0');
      const point = {
        x: gridWidth * colIndex + gridWidth / 2,
        y: gridHeight * rowIndex + gridHeight / 2,
        fillColor: `#${red + green}00`,
      };
      data.push(point);
    }
  }
  return data;
}

const data = generateMarkData();

const arcs = [];
for (let i = 0; i < 1; i += 1) {
  arcs.push({
    points: generateArcs(size, size),
  });
}

const arc = new AnimatedArc(arcLayer.ctx, {
  data: arcs,
  rate: 0.5,
  strokeStyle: 'rgba(255, 120, 2, 0.2)',
  getPointSet(d) {
    return d.points;
  },
  onAnimationEnd: () => {
    arcLayer.clear();
    arcs.length = 0;
    for (let i = 0; i < 1000; i += 1) {
      const red = Math.ceil(255 - i * 255 / 1000).toString(16).padStart(2, '0');
      arcs.push({
        strokeStyle: `#${red}0022`,
        points: generateArcs(size, size),
      });
    }
    arc.setOptions({
      data: arcs,
    });
    arc.start();
  },
});
arc.start();

const massMarks = new MassMarks(massMarksLayer.ctx, {
  data,
  radius,
});

/* Click event demo */
layerManager.on('click', (point) => {
  const clickedPoints = massMarks.getNearest(point, radius, 1);
  if (clickedPoints.length) {
    const clickedPoint = clickedPoints[0][0];
    console.log(clickedPoint);
  }
}, massMarksLayer);

layerManager.on('mousemove', function (point) {
  const clickedPoints = massMarks.getNearest(point, radius, 1);
  if (clickedPoints.length) {
    const clickedPoint = clickedPoints[0][0];
    this.root.style.cursor = 'pointer';
    labelText.innerText = clickedPoint.fillColor;
    labelText.style.backgroundColor = clickedPoint.fillColor;
  } else {
    this.root.style.cursor = 'default';
  }
}, massMarksLayer);

massMarks.start();
