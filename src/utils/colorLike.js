import { DEVICE_PIXEL_RATIO } from 'ol/has';
const pixelRatio = DEVICE_PIXEL_RATIO;

var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
var gradient = (function () {
	var grad = context.createLinearGradient(0, 0, 512 * pixelRatio, 0);
	grad.addColorStop(0, 'red');
	grad.addColorStop(1 / 6, 'orange');
	grad.addColorStop(2 / 6, 'yellow');
	grad.addColorStop(3 / 6, 'green');
	grad.addColorStop(4 / 6, 'aqua');
	grad.addColorStop(5 / 6, 'blue');
	grad.addColorStop(1, 'purple');
	return grad;
})();

// Generate a canvasPattern with two circles on white background
var pattern = (function () {
	canvas.width = 8 * pixelRatio;
	canvas.height = 8 * pixelRatio;
	var gradient = context.createLinearGradient(0, 0, 0, 8 * pixelRatio);

	// canvas.addColorStop(stop, color);
	gradient.addColorStop(0, '#f00');
	gradient.addColorStop(1, '#00f');
	context.fillStyle = gradient; //设置fillStyle为当前的渐变对象
	context.fillRect(0, 0, 8 * pixelRatio, 8 * pixelRatio);

	return context.createPattern(canvas, 'repeat');
	// white background
	context.fillStyle = 'white';
	context.fillRect(0, 0, canvas.width, canvas.height);
	// outer circle
	context.fillStyle = 'rgba(102, 0, 102, 0.5)';
	context.beginPath();
	context.arc(4 * pixelRatio, 4 * pixelRatio, 3 * pixelRatio, 0, 2 * Math.PI);
	context.fill();
	// inner circle
	context.fillStyle = 'rgb(55, 0, 170)';
	context.beginPath();
	context.arc(4 * pixelRatio, 4 * pixelRatio, 1.5 * pixelRatio, 0, 2 * Math.PI);
	context.fill();
	return context.createPattern(canvas, 'repeat');
})();

export { pattern };
