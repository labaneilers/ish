"use strict";

var assert = require("chai").assert;
var rewire = require("rewire");
var path = require("path");

var langDir = require("../lib/lang-dir");

describe("lang-dir", function () {

    describe("#getWwwDir()", function () {

        it("should replace a path with www", function () {
            var result = langDir.getWwwDir("/root/a/b/c/www.de/foo/bar/baz.png");

            assert.equal(result, "/root/a/b/c/www/foo/bar/baz.png");
        });

        it("should replace a path with www, 2", function () {
            var result = langDir.getWwwDir("/Library/WebServer/Documents/ish/assets/www.de/abc/image1-2x.png.imagesettings.xml");

            assert.equal(result, "/Library/WebServer/Documents/ish/assets/www/abc/image1-2x.png.imagesettings.xml");
        });

        it("should replace a path with www using windows format", function () {
            var result = langDir.getWwwDir("C:\\root\\a\\b\\c\\www.de\\foo\\bar\\baz.png");

            assert.equal(result, "C:\\root\\a\\b\\c\\www\\foo\\bar\\baz.png");
        });
    });
});