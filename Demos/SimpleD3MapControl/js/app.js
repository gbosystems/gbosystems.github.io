(function () {

    // VARIABLES
    var svg = d3.select("#map");
    var features = svg.append("g");
    var height = svg.node().parentElement.offsetHeight - 4;
    var width = svg.node().parentElement.offsetWidth;
    var projection = d3.geo.mercator().translate([width / 2, height / 2]);
    var path = d3.geo.path().projection(projection);
    var zoom;
    var zoomControl;
    var locationTracker;
    var transform = null;

    var ZOOM_MAX = 8;
    var ZOOM_MIN = 1;

    /**
     * Returns an object representing the style transform value */
    var parseTransform = function(transform) {
        var result = {};
        var start;
        var middle;
        var end;

        if (transform === null || typeof (transform) === "undefined") {
            transform = "";
        }

        // Parse scale
        start = transform.indexOf("scale(");

        if (start >= 0) {
            start += "scale(".length;
            end = transform.indexOf(")", start);
            result.scale = parseFloat(transform.substring(start, end));
        } else {
            result.scale = 1;
        }
        
        // Parse translate
        start = transform.indexOf("translate(");

        if (start >= 0) {
            start += "translate(".length;
            middle = transform.indexOf(",", start);
            end = transform.indexOf(")", middle);
            result.translate = {
                x: parseFloat(transform.substring(start, middle)),
                y: parseFloat(transform.substring(middle + 1, end))
            };
        } else {
            result.translate = {x: 0, y: 0};
        }

        return result;
    }


    var dropPin = function(location) {
        var coord = projection([location.lon, location.lat]);

        var p = iconFactory.new(features, "pin")
            .attr("class", "pin")
            .attr("fill", "red");

        var pinData = {
            x: coord[0] - p.property("width").baseVal.value / 2,
            y: coord[1] - p.property("height").baseVal.value,
            width: p.property("width").baseVal.value,
            height: p.property("height").baseVal.value
        };

        p.datum(pinData)
            .attr("x", pinData.x)
            .attr("y", pinData.y)
            .attr("transform", function(p) {
                var t = {
                    x: (p.x + p.width / 2) * (transform.scale - 1),
                    y: (p.y + p.height) * (transform.scale - 1)
                };
                return "scale(" + (1 / transform.scale) + ")translate(" + t.x + "," + t.y + ")";
            });
    };


    var handleScaleChanged = function (scale) {

        // Move zoom scale
        d3.select(".zoom-range").property("value", scale);

        // Scale borders
        features.select(".land").style("stroke-width", 1.5 / scale + "px");

        // Scale dropped pins
        d3.selectAll(".pin")
            .attr("transform", function(p) {
                var t = {
                    x: (p.x + p.width / 2) * (scale - 1),
                    y: (p.y + p.height) * (scale - 1)
                };
                return "scale(" + (1 / scale) + ")translate(" + t.x + "," + t.y + ")";
        });
    }


    var handleZoom = function (delta) {
        var scale = transform.scale;

        if ((scale + delta ) > 8 || (scale + delta) < 1)
            return;

        // This whole business could probably be simplified. Seems to work though.
        var translatedCenter = {
                x: ((width / 2) - (transform.translate.x)) / scale,
                y: ((height / 2) - (transform.translate.y)) / scale
        }

        scale += delta;

        var translate = [
            -1 * ((translatedCenter.x * scale) - (width / 2)),
            -1 * ((translatedCenter.y * scale) - (height / 2))
        ];

        zoom.scale(scale);
        zoom.translate(translate);

        transform.translate = { x: translate[0], y: translate[1] };
        transform.scale = scale;

        features.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
        handleScaleChanged(scale);
    }


    var handleZoomTo = function(scale) {
        scale -= transform.scale;
        if (scale === 0)
            return;
        handleZoom(scale);
    }


    function ready(error, world) {
        
        features.append("path", ".graticule")
            .datum(topojson.feature(world, world.objects.countries))
            .attr("class", "land")
            .attr("d", path);

        transform = parseTransform(features.attr("transform"));

        dropPin({ lat: 45, lon: -85 });
        dropPin({ lat: 40, lon: -80 });
        dropPin({ lat: 35, lon: -95 });

        handleScaleChanged(1);
    }

   
    // RESIZE SVG
    svg.attr("height", height).attr("width", width);


    // ZOOM CONTROL
    zoomControl = d3.select(svg.node().parentElement).append("div").attr("class", "zoom-control");

    zoomControl.append("div")
        .attr("class", "zoom-in")
        .on("click", function () { handleZoom(0.2); });

    zoomControl.append("div")
        .attr("class", "zoom-out")
        .on("click", function () { handleZoom(-0.2); });

    var zoomControlRange = zoomControl.append("input")
        .attr("type", "range")
        .attr("min", ZOOM_MIN)
        .attr("max", ZOOM_MAX)
        .attr("step", 0.1)
        .attr("class", "zoom-range");

    zoomControlRange.on("input", function () {
        handleZoomTo(zoomControlRange.property("value"));
    });

    zoomControlRange.on("change", function () {
        handleZoomTo(zoomControlRange.property("value"));
    });


    // LOCATION TRACKER
    locationTracker = d3.select(svg.node().parentElement).append("div").attr("class", "location-tracker");


    // SVG EVENT HANDLERS
    zoom = d3.behavior.zoom()
        .translate([0, 0])
        .scale(1)
        .scaleExtent([1, 8])
        .on("zoom", function () {
            transform.translate = { x: d3.event.translate[0], y: d3.event.translate[1] };
            transform.scale = d3.event.scale;
            features.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            handleScaleChanged(d3.event.scale);
    });

    svg.call(zoom);

    svg.on("mousemove", function () {
        var location = d3.mouse(this);

        var translatedLocation = [
            (location[0] - transform.translate.x) / transform.scale,
            (location[1] - transform.translate.y) / transform.scale
        ];

        var p = projection.invert(translatedLocation);

        if (p[0] > 180 || p[0] < -180) {
            locationTracker.style("visibility", "hidden");
            return;
        }

        locationTracker.text(p[0].toFixed(3) + ", " + p[1].toFixed(3));

        if (locationTracker.style("visibility") !== "visible") {
            locationTracker.style("visibility", "visible");
        }
    });

    svg.on("mouseout", function() {
        locationTracker.style("visibility", "hidden");
    });

    // PIN FORM
    var pinForm = d3.select(svg.node().parentElement).append("div").attr("class", "pin-form");
    var pinFormSubmit;

    var latInput = pinForm.append("input")
        .attr("type", "text")
        .attr("placeholder", "Latitude")
        .on("keydown", function () {
            if (d3.event.keyCode === 13) {
                pinFormSubmit();
            }
        });

    var lonInput = pinForm.append("input")
        .attr("type", "text")
        .attr("placeholder", "Longitude")
        .on("keydown", function() {
            if (d3.event.keyCode === 13) {
                pinFormSubmit();
            }
        });

    pinForm.append("button")
        .text("Add Pin")
        .on("click", function() {
            pinFormSubmit();
    });

    pinFormSubmit = function() {
        var lat = parseFloat(latInput.property("value"));
        var lon = parseFloat(lonInput.property("value"));

        dropPin({ lat: lat, lon: lon });

        latInput.property("value", "");
        lonInput.property("value", "");
    }

    queue()
        .defer(d3.json, "../files/world-110m.json")
        .await(ready);


})();