"use strict";

var assert = require("chai").assert;
// var rewire = require("rewire");
// var util = require("util");
var imageProcessor = require("../lib/image-processor");
// var fs = require("fs");
var path = require("path");

var assetsRootPath = path.resolve(__dirname, "../assets");

describe("image-processor", function () {

    this.timeout(6000);

    describe("#process()", function () {

        var verifyImageResult = function (filePath, expectedBestFormat, expectedAlpha, expectedTransparencyMistake) {
            it.only("should interpret " + filePath + " as a " + expectedBestFormat + " with alpha:" + expectedAlpha, function () {
                var fullPath = path.join(assetsRootPath, filePath);

                return imageProcessor.process(fullPath)
                    .then(
                        function (result) {
                            try {
                                assert.equal(result.bestFormat, expectedBestFormat);
                                assert.equal(result.transparencyMistake || "", expectedTransparencyMistake || "");

                                var assertionMethod = expectedAlpha ? assert.isTrue : assert.isFalse;
                                assertionMethod(result.alpha, "Should have resulted in alpha:" + expectedAlpha);
                            } catch (ex) {
                                ex.message = filePath + ": " + ex.message;
                                throw ex;
                            }
                        });
            });
        };

        // verifyImageResult("www/abc/arrow-trans-2x.png", "png", true);
        // verifyImageResult("www/def/elephant-opaque-2x.png", "jpg", false);
        // verifyImageResult("www/abc/text-flat-opaque-2x.png", "png", false);
        // verifyImageResult("www/abc/text-flat-opaque-2-2x.png", "png", false);
        // verifyImageResult("www/abc/text-flat-opaque-3-2x.png", "png", false);
        // verifyImageResult("www/def/icons-flat-trans-2x.png", "png", true);
        // verifyImageResult("www/logo-trans-2x.png", "png", true);
        // verifyImageResult("www/hoodies-mistaketrans-2x.png", "jpg", false, "minor");
        // verifyImageResult("www/abc/flat-circle-mistaketrans-2x.png", "png", false, "minor");
        // verifyImageResult("www/photo-with-trans-2x.png", "unknown", true, "major");
        // verifyImageResult("www/small-flat-trans-2x.png", "png", true);
        // verifyImageResult("www/def/gradient-flat-opaque-2x.png", "png", false);
        // verifyImageResult("www.de/abc/text-flat-opaque-2x.png", "png", false);
        verifyImageResult("www/problems/pink-flat-opaque-2x.png", "png", false);
        // verifyImageResult("www/problems/vplogo-flat-opaque-2x.png", "png", false);
        // verifyImageResult("www/posterized-photo-opaque-2x.png", "jpg", false);
        // verifyImageResult("www.de/abc/text-flat-shouldchange-2x.png", "png", false);
        // verifyImageResult("www/text-flat-opaque-2x.png", "png", false);
        // verifyImageResult("www/problems/big-gradient-opaque-2x.png", "png", false);
        // verifyImageResult("www/photo-mistaketrans-2x.png", "jpg", false, "minor");
        // verifyImageResult("www/problems/large-purple-flat-opaque-2x.png", "png", false);

        
    });
});