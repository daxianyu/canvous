/**
 * @param matrix - two dimensional array
 * [[1 2 3], [1 2 1], [0 1 1]]
 * @param vector
 * @return {*}
 */
function matrixMultipleVector(matrix, vector) {
  return matrix.map(row => {
    return row.reduce((sum, cell, i) => {
      return sum + cell * vector[i];
    }, 0);
  });
}

function matrixMultiplication(a, b) {
  return a.map((row) => {
    return row.map((_, i) => {
      return row.reduce((sum, cell, j) => {
        return sum + cell * b[j][i];
      }, 0);
    });
  });
}

function getRadOfVector(vector) {
  const [x, y] = vector;
  const rad = Math.atan(y / x);
  if (x >= 0 && y >= 0) {
    return rad;
  }
  if (x <= 0) {
    return Math.PI + rad;
  }
  return 2 * Math.PI + rad;
}

const vectors = [
  [1.1, 0.1],
  [-1.1, 0.1],
  [-1.1, -0.1],
  [1.1, -0.1],
];

function getRotateMatrix(rad) {
  const cosRad = Math.cos(rad);
  const sinRad = Math.sin(rad);
  return [
    [cosRad, -sinRad, 0],
    [sinRad, cosRad, 0],
    [0, 0, 1],
  ];
}

function testM() {
  const limit = 20000;
  const data = [];
  const scale = [
    [2.1, 0, 0],
    [0, 2, 0],
    [0, 0, 0],
  ];

  const v = [1, 2, 0];

  for (let i = 0; i < limit; i++) {
    data.push([
      3 * Math.random(), 5 * Math.random(),
    ]);
  }

  const aa = performance.now();
  for (let i = 0; i < limit; i++) {
    const rad = getRadOfVector(data[i]);
    const rotate = getRotateMatrix(rad);
    const result = matrixMultiplication(scale, rotate);
    matrixMultipleVector(result, v);
  }
  console.log(performance.now() - aa);
}
// testM();
