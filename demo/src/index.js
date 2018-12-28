import { MassMarks } from 'canvous';
import MultiLayer, { Layer } from './MultiLayer';

const container = document.getElementById('app');
const canvas = document.createElement('canvas');

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

layerManager.addLayer(massMarksLayer);

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
      data.push({
        x: gridWidth * colIndex + gridWidth / 2,
        y: gridHeight * rowIndex + gridHeight / 2,
        fillColor: `#${red + green}00`,
      });
    }
  }
  return data;
}

const data = generateMarkData();

const massMarks = new MassMarks(massMarksLayer.ctx, {
  data,
  radius,
});

/* Click event demo */
layerManager.on('click', function (point) {
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
