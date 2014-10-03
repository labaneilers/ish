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

    return Q.nfcall(img.identify.bind(img))
        .then(function (value) {

            // console.log("-------------");
            // console.log(filePath);
            // console.log(value);
            // console.log("-------------");

            var alpha = value["Channel statistics"].Alpha;
            if (alpha && alpha.kurtosis) {
                isTransparent = parseFloat(alpha.kurtosis) !== 0;
            }

            return bakeOff(img);
        })
        .then(function (result) {
            if (isTransparent) 
            {
                result.bestFormat = "png";
                result.alpha = isTransparent;
                return result;
            }
        })
};