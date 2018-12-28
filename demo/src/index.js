import { MassMarks } from 'canvous';

const container = document.getElementById('app');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 1000;
canvas.height = 1000;

container.appendChild(canvas);

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
        row: rowIndex,
        col: colIndex,
        fillColor: 'black',
      });
    }
  }
  return data;
}

const data = generateMarkData();

const massMarks = new MassMarks(ctx, {
  data,
  radius: 50,
});

massMarks.start();
