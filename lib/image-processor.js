var imageMagick = require("gm").subClass({
    imageMagick: true
});
var Q = require("Q");
// var fs = require("fs");

function getImage(filePath) {
    return imageMagick(filePath).options({
        imageMagick: true
    });
}

function writeJpeg(img) {
    var jpeg = img.compress("JPEG").quality(85);

    return Q.nfcall(jpeg.toBuffer.bind(jpeg), "JPG");
}

function writePng(img) {
    var png = img; //.colors(64);
    return Q.nfcall(png.toBuffer.bind(png), "PNG");
}

// function saveBuffer(buffer, filePath, ext) {
//     fs.writeFileSync(filePath.replace(".png", ext), buffer);
// }

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
                    jpg: jpegLength
                };
            });
};

exports.process = function(filePath) {
    
    var img = getImage(filePath);

    var isTransparent = false;
    var isGrayscale = false;
    var colorCount = 255;
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

                return result;
            });
};