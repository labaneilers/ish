"use strict";

var assert = require("chai").assert;
var rewire = require("rewire");
var path = require("path");

var stopwatch = require("../lib/stopwatch");

describe("stopwatch", function () {

    describe("#renderTimeSpan()", function () {

        var render = function (seconds) {
            return stopwatch.renderTimeSpan(new Date(0), new Date(seconds * 1000));
        };

        it("should render 2 minutes correctly", function () {
            var result = render(120);

            assert.equal(result, "2 minutes");
        });

        it("should render 2 minutes, 1 second correctly", function () {
            var result = render(121);

            assert.equal(result, "2 minutes, 1 second");
        });

        it("should render 2 minutes, 2 seconds correctly", function () {
            var result = render(122);

            assert.equal(result, "2 minutes, 2 seconds");
        });

        it("should render 2 minutes, 2 seconds correctly", function () {
            var result = render(62);

            assert.equal(result, "1 minute, 2 seconds");
        });

        it("should render 1 hour correctly", function () {
            var result = render(3600);

            assert.equal(result, "1 hour");
        });

        it("should render 1 hour, 10 seconds correctly", function () {
            var result = render(3610);

            assert.equal(result, "1 hour, 10 seconds");
        });

    });
});