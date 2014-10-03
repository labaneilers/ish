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
    return Q.nfcall(img.toBuffer.bind(img), "PNG");
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
                    jpg: jpegLength,
                    alpha: false
                };
            });
};

exports.process = function(filePath) {
    
    var img = getImage(filePath);

    var isTransparent = false;
    var isGrayscale = false;
    var colorCount = 255;

    return Q.nfcall(img.identify.bind(img))
        .then(function (value) {

            // console.log("-------------");
            // console.log(filePath);
            // console.log(value);
            // console.log("-------------");

            var alpha = value["Channel statistics"].Alpha;
            // if (alpha && alpha.mean) {
            //     isTransparent = parseFloat(alpha.mean) <= 254;
            // }
            
            if (alpha && alpha["standard deviation"]) {
                isTransparent = parseFloat(alpha["standard deviation"]) >= 2.5;
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
                if (isTransparent) 
                {
                    result.alpha = isTransparent;

                    if ((result.png / result.jpg) > 1.5 && colorCount > 64)
                    {
                        result.message = "POSSIBLE TRANSPARENCY MISTAKE";
                        result.bestFormat = "unknown";
                    }
                    else
                    {
                        result.bestFormat = "png";
                    }
                }

                return result;
            });
};