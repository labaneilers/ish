var timeSpan = require("timespan");

var renderTimeElement = function (elapsed, singular, output) {
    var plural = singular + "s";
    if (elapsed[plural] > 0) {
        output.push(elapsed[plural] + " " + (elapsed[plural] >= 2 ? plural : singular));
    }
};

exports.renderTimeSpan = function (startDate, endDate) {
    var elapsed = timeSpan.fromDates(startDate, endDate);
    var output = [];

    renderTimeElement(elapsed, "hour", output);
    renderTimeElement(elapsed, "minute", output);
    renderTimeElement(elapsed, "second", output);

    return output.join(", ");
};