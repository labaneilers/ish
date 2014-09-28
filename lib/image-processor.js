var imageMagick = require("gm").subClass({
    imageMagick: true
});
var Q = require("Q");
var fs = require("fs");

function writeJpeg(filePath) {
    var img = imageMagick(filePath)
        .options({
            imageMagick: true
        })
        .compress("JPEG")
        .quality(85);

    return Q.nfcall(img.toBuffer.bind(img), "JPG");
}

function writePng(filePath) {
    var img = imageMagick(filePath)
        .options({
            imageMagick: true
        });

    return Q.nfcall(img.toBuffer.bind(img), "PNG");
}

function saveBuffer(buffer, filePath, ext) {
    fs.writeFileSync(filePath.replace(".png", ext), buffer);
}

exports.process = function(filePath, saveTemp) {
    var jpegLength = 0;
    var pngLength = 0;

    return writeJpeg(filePath)
        .then(
            function(buffer) {
                jpegLength = buffer.length;
                if (saveTemp) {
                    saveBuffer(buffer, filePath, "_ishtmp.jpg");
                }

                return writePng(filePath);
            })
        .then(
            function(buffer) {
                pngLength = buffer.length;
                if (saveTemp) {
                    saveBuffer(buffer, filePath, "_ishtmp.png");
                }

                return {
                    bestFormat: pngLength < jpegLength ? "png" : "jpg",
                    png: pngLength,
                    jpg: jpegLength
                };
            });
};