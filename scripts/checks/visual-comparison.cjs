const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('../../node_modules/playwright-core/lib/utilsBundle.js');

const DEFAULT_CHANNEL_TOLERANCE = 20;
const DEFAULT_MAX_DIFFERENT_PIXEL_RATIO = 0.002;
const NEUTRAL_PIXEL = [247, 245, 239, 255];

function fill(png, pixel) {
  for (let index = 0; index < png.data.length; index += 4) {
    png.data[index] = pixel[0];
    png.data[index + 1] = pixel[1];
    png.data[index + 2] = pixel[2];
    png.data[index + 3] = pixel[3];
  }
}

function copyToCanvas(source, target) {
  const rowLength = source.width * 4;
  for (let row = 0; row < source.height; row += 1) {
    source.data.copy(target.data, row * target.width * 4, row * rowLength, (row + 1) * rowLength);
  }
}

function comparePng(actualBuffer, expectedBuffer, channelTolerance = DEFAULT_CHANNEL_TOLERANCE) {
  const actual = PNG.sync.read(actualBuffer);
  const expected = PNG.sync.read(expectedBuffer);
  const width = Math.max(actual.width, expected.width);
  const height = Math.max(actual.height, expected.height);
  const actualCanvas = new PNG({ width, height });
  const expectedCanvas = new PNG({ width, height });
  const diff = new PNG({ width, height });
  fill(actualCanvas, NEUTRAL_PIXEL);
  fill(expectedCanvas, NEUTRAL_PIXEL);
  copyToCanvas(actual, actualCanvas);
  copyToCanvas(expected, expectedCanvas);

  let differentPixels = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const inActual = x < actual.width && y < actual.height;
      const inExpected = x < expected.width && y < expected.height;
      const different = !inActual || !inExpected || [0, 1, 2, 3].some((channel) => (
        Math.abs(actualCanvas.data[index + channel] - expectedCanvas.data[index + channel]) > channelTolerance
      ));
      if (different) differentPixels += 1;
      diff.data[index] = different ? 220 : actualCanvas.data[index] * 0.25;
      diff.data[index + 1] = different ? 38 : actualCanvas.data[index + 1] * 0.25;
      diff.data[index + 2] = different ? 38 : actualCanvas.data[index + 2] * 0.25;
      diff.data[index + 3] = 255;
    }
  }

  return {
    actual,
    actualCanvas,
    diff,
    differentPixels,
    expected,
    expectedCanvas,
    ratio: differentPixels / (width * height),
    sameDimensions: actual.width === expected.width && actual.height === expected.height,
    totalPixels: width * height,
  };
}

function writeComparisonArtifacts(directory, name, comparison, separator = '.') {
  const stem = name.replace(/\.png$/, '');
  fs.mkdirSync(directory, { recursive: true });
  const paths = {
    actual: path.join(directory, `${stem}${separator}actual.png`),
    diff: path.join(directory, `${stem}${separator}diff.png`),
    expected: path.join(directory, `${stem}${separator}expected.png`),
  };
  fs.writeFileSync(paths.actual, PNG.sync.write(comparison.actual));
  fs.writeFileSync(paths.expected, PNG.sync.write(comparison.expected));
  fs.writeFileSync(paths.diff, PNG.sync.write(comparison.diff));
  return paths;
}

module.exports = {
  DEFAULT_CHANNEL_TOLERANCE,
  DEFAULT_MAX_DIFFERENT_PIXEL_RATIO,
  comparePng,
  writeComparisonArtifacts,
};
