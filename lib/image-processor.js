var imageMagick = require("gm").subClass({
    imageMagick: true
});
var fs = require("fs");
var Q = require("Q");
var temp = require("temp");

function getImage(filePath) {
    return imageMagick(filePath).options({
        imageMagick: true
    });
}

function writeJpeg(img) {
    var jpeg = img.compress("JPEG").quality(85);

    return Q.nfcall(jpeg.toBuffer.bind(jpeg), "JPG");
}

function writePng(img, colors) {
    var png = img;
    if (colors) {
        png = png.colors(64);
    }
    return Q.nfcall(png.toBuffer.bind(png), "PNG");
}

function saveBuffer(buffer, filePath) {
    fs.writeFileSync(filePath, buffer);
}

var bakeOff = function (img) {
    var jpegLength = 0;
    var pngLength = 0;

    return writeJpeg(img)
        .then(
            function(buffer) {
                jpegLength = buffer.length;

                return writePng(img);
            })
        .then(
            function(buffer) {
                pngLength = buffer.length;

                return {
                    bestFormat: pngLength < jpegLength ? "png" : "jpg",
                    png: pngLength,
                    jpg: jpegLength,
                    pngBuffer: buffer
                };
            });
};

// Quantizes the image to 64 colors, and and adds the "equality" (read: quantization error) value to the result.
var getResultWithQuantizationDiff = function (result, img) {
    var tempPath32bit = temp.path({ prefix: "ish-", suffix: ".png" });
    var tempPathQuantized = temp.path({ prefix: "ish-", suffix: ".png" });

    return writePng(img, 64)
        .then(function (buffer) {
            result.pngQuantized = buffer.length;

            saveBuffer(buffer, tempPathQuantized);
            saveBuffer(result.pngBuffer, tempPath32bit);

            var defer = Q.defer();

            imageMagick().compare(tempPath32bit, tempPathQuantized, function (err, isEqual, equality /*, raw */) {

                fs.unlinkSync(tempPath32bit);
                fs.unlinkSync(tempPathQuantized);

                result.equality = equality;
                defer.resolve(result);
            });

            return defer.promise;
        });
};

exports.process = function(filePath) {
    
    var img = getImage(filePath);

    var isTransparent = false;
    var isGrayscale = false;
    var colorCount = Infinity;
    var transparencyMistake = null;

    return Q.nfcall(img.identify.bind(img))
        .then(function (value) {

            var alpha = value["Channel statistics"].Alpha;
            
            // Based on real-world data, images with a low enough standard deviation
            // on the alpha channel probably only contain transparent pixels by mistake.
            if (alpha && alpha["standard deviation"]) {
                var alphaStandardDeviation = parseFloat(alpha["standard deviation"]);
                if (alphaStandardDeviation >= 2.5) {
                    isTransparent = true;
                } else if (alphaStandardDeviation > 0) {
                    // There are just a few transparent pixels.
                    // This is probably a mistake.
                    transparencyMistake = "minor";
                }
            }

            var gray = value["Channel statistics"].Gray;
            if (gray) {
                isGrayscale = true;
            }

            var colors = value["Colors"];
            if (colors) {
                colorCount = colors.length;
            }

            return bakeOff(img);
        })
        .then(
            function (result) {

                result.filePath = filePath;
                result.alpha = isTransparent;
                result.colors = colorCount;
                result.grayscale = isGrayscale;
                result.transparencyMistake = transparencyMistake;

                if (isTransparent) 
                {
                    // If the image contains transparency, and it is more than 150% bigger as a PNG,
                    // it is probably a mistake. 
                    if ((result.png / result.jpg) > 1.5 && colorCount > 64)
                    {
                        result.transparencyMistake = "major";
                        result.bestFormat = "unknown";
                    }
                    else
                    {
                        // If the image is transparent, it must be a PNG.
                        result.bestFormat = "png";
                    }
                }
                else if (result.colors < 512 && result.bestFormat == "jpg")
                {
                    // The jpg size is smaller than the 32bit png size,
                    // but image has a limited number of colors, and might be a good candidate for quantization.

                    return getResultWithQuantizationDiff(result, img)
                        .then(function (result) {

                            // if the quantization produced very similar results, 
                            // then compare the quantized size (instead of the 32bit png size) to the jpeg size.
                            if (result.equality < 0.001) {
                                result.bestFormat = result.pngQuantized < result.jpg ? "png" : "jpg";
                            }

                            return result;
                        });
                }

                return result;
            })
            .then(
                function (result) {
                    delete result.pngBuffer;
                    return result;
                });
};