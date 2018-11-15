import { getMidperpandicular, getRadOfVector } from './utils';

const canvas = document.getElementById('demo');
const ctx = canvas.getContext('2d');

const point1 = [1024, 0];
const point2 = [0, 1024];

ctx.strokeStyle = '#1619ee';


function drawArc(center, points, radius) {
  const [xc, yc] = center;
  const [point1, point2] = points;
  const [xp1, yp1] = point1;
  const [xp2, yp2] = point2;
  let startAngle = getRadOfVector([xp1 - xc, yp1 - yc]);
  let endAngle = getRadOfVector([xp2 - xc, yp2 - yc]);

  if (startAngle > endAngle && startAngle - endAngle < Math.PI) {
    const temp = startAngle;
    startAngle = endAngle;
    endAngle = temp;
  }
  ctx.beginPath();
  ctx.arc(xc, yc, radius, startAngle, endAngle);
  ctx.stroke();
}

function drawArcs(points, rate) {
  const [point1, point2] = points;
  const radiusAndCenters = getMidperpandicular(point1, point2)(rate);
  const { centers, radius } = radiusAndCenters;
  const [c1, c2] = centers;
  if (Math.random() > 0.5) {
    drawArc(c1, points, radius);
  } else {
    drawArc(c2, points, radius);
  }
}

function draw() {
  window.requestAnimationFrame(() => {
    canvas.width = canvas.width;
    ctx.strokeStyle = '#1619ee';
    for (let i = 0; i < 10; i += 1) {
      drawArcs([point1, point2], Math.random() * 1.3);
    }
    draw();
  });
}
