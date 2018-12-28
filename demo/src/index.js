import { MassMarks } from 'canvous';
import MultiLayer, { Layer } from './MultiLayer';

const container = document.getElementById('app');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

const layerManager = new MultiLayer(container, {
  height: 1000,
  width: 1000,
});

const massMarksLayer = new Layer(canvas, {
  fitSize: true,
});

layerManager.addLayer(massMarksLayer);

const radius = 50;
/**
 * @return {Array}
 */
function generateMarkData() {
  const data = [];
  const { width, height } = canvas;
  const colCount = 10;
  const rowCount = 10;
  const gridWidth = width / colCount;
  const gridHeight = height / colCount;

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    for (let colIndex = 0; colIndex < colCount; colIndex += 1) {
      data.push({
        x: gridWidth * colIndex + gridWidth / 2,
        y: gridHeight * rowIndex + gridHeight / 2,
        fillColor: 'black',
      });
    }
  }
  return data;
}

const data = generateMarkData();

const massMarks = new MassMarks(ctx, {
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

massMarks.start();
