(function () {

    var getWidth = function() {
        return d3.select("div.main-content").property("offsetWidth");
    }

    var getHeight = function () {
        return parseInt(d3.select("div.main-content").property("offsetHeight"));
    }

    var fitMapToCanvas = function (projection, element) {
        
        /* "Bounding box" for the albersUsa projection. */
        var bounds = [projection([-122.41432506480794, 21.59073159116564]), projection([-64.33531678128165, 48.49054873086005])];
        var width = element.attr("width");
        var height = element.attr("height");
        var dx = bounds[1][0] - bounds[0][0];
        var dy = bounds[1][1] - bounds[0][1];
        var x = (bounds[0][0] + bounds[1][0]) / 2;
        var y = (bounds[0][1] + bounds[1][1]) / 2;

        var scale = .9 / Math.max(Math.abs(dx / width), Math.abs(dy / height));
        var translate = [width / 2 - scale * x, height / 2 - scale * y];

        element.attr("transform", "translate(" + translate + ")scale(" + scale + ")");
    }

    var ready = function(error, states, us, earthquakes) {
        var width = getWidth() - 20,
            height = getHeight() - 25;

        // Page title
        d3.select(".title").append("h1")
            .text(earthquakes.metadata.title);

        var hexbin = d3.hexbin()
            .size([width, height])
            .radius(7);

        var color = d3.scale.linear()
            .domain([1, 100])
            .range(["white", "red"])
            .interpolate(d3.interpolateLab);

        var projection = d3.geo.albersUsa()
            .scale(1100)
            .translate([width / 2, height / 2]);

        var path = d3.geo.path()
            .projection(projection);

        var tooltip = d3.select("div.content").append("div")
            .attr("class", "tooltip")
            .style("visibility", "hidden");

        var controlButtonEnableCheck;
        var controlBottom;
        var controlTop;
        var sidebar = d3.select("div.sidebar-content")
            .on("wheel", function() {
                var current = sidebar.property("scrollTop");
                sidebar.property("scrollTop", current + (d3.event.deltaY * 80));
                controlButtonEnableCheck();
            });

            sidebar.append("p")
            .text("Select a hexagon to display earthquakes.");

        controlButtonEnableCheck = function() {
            if (sidebar.property("scrollTop") === sidebar.property("scrollTopMax")) {
                controlBottom.attr("data-disabled", "true");
            } else {
                controlBottom.attr("data-disabled", null);
            }

            if (sidebar.property("scrollTop") > 0) {
                controlTop.attr("data-disabled", null);
            } else {
                controlTop.attr("data-disabled", "true");
            }
        }

        // Ugly, but it's a demo, you get what you pay for
        controlBottom = d3.select("#control-bottom").on("click", function () {
            if (this.getAttribute("data-disabled") === "true") {
                return;
            }

            var current = sidebar.property("scrollTop");
            sidebar.property("scrollTop", current + 80);
            controlButtonEnableCheck();
        });

        controlTop = d3.select("#control-top").on("click", function () {
            if (this.getAttribute("data-disabled") === "true") {
                return;
            }

            var current = sidebar.property("scrollTop");
            sidebar.property("scrollTop", current - 80);
            controlButtonEnableCheck();
        });

        var svg = d3.select("div.main-content").append("svg:svg")
            .style("margin", "10px")
            .attr("width", width)
            .attr("height", height);
        //.on("click", function(e) {
        //    console.log(projection.invert(d3.mouse(this)));
        //});

        svg.insert("path", ".graticule")
            .datum(topojson.feature(us, us.objects.land))
            .attr("class", "land")
            .attr("d", path);

        svg.insert("path", ".graticule")
            .datum(topojson.mesh(states, states.objects.states, function (a, b) { return a !== b; }))
            .attr("class", "state-boundary")
            .attr("d", path);

        var selected;

        var displayDescription = function(quakes) {
            
            sidebar.selectAll("*").remove();
            sidebar.text(null);

            sidebar.append("ul")
                .selectAll("li")
                .data(quakes)
                .enter()
                .append("li")
                .append("a")
                .attr("href",function (d) { return d.url; })
                .text(function (d) { return d.title; });

            sidebar.property("scrollTop", 0);
            controlButtonEnableCheck();
        }

        var mousemove = function () {
            var pt = [d3.event.pageX, d3.event.pageY];
            tooltip.style("top", (pt[1] - 30) + "px").style("left", (pt[0] + 20) + "px");
        };

        var mouseover = function () {
            var d = d3.select(this).data()[0];
            tooltip.text("Total of " + d.length + " earthquake(s).");
        };

        var selectedMouseover = function () {
            var id = d3.select(this).attr("xlink:href");
            var d = d3.select(id).data()[0];
            tooltip.text("Total of " + d.length + " earthquake(s).");
        };

        var setMousedown = function (element, isMousedown) {
            if (!isMousedown) {
                var data = element.data()[0];
                var id = "#" + data[0].id;
                element.style("fill", color(data.length));
                selected.attr("xlink:href", id);
                d3.select(".selected").classed({ "selected": false });
                d3.select(id).classed({ "selected": true });
                displayDescription(data);

            }
            element.classed({ "mousedown": isMousedown });
        }

        // Map the GeoJSON earthquake data into a point array (with properties)
        var points = [];
        earthquakes.features.forEach(function(feature) {
            var pt = projection(feature.geometry.coordinates);
            if (pt) {
                pt.title = feature.properties.title;
                pt.id = "hexbin_" + points.length;
                pt.magnitude = feature.properties.mag;
                pt.time = new Date(feature.properties.time);
                pt.url = feature.properties.url;
                points.push(pt);
            }
        });
        var data = hexbin(points);

        // Sort earthquakes in each hexagon by magnitude
        data.forEach(function(d) {
            d.sort(function(a, b) { return b.magnitude - a.magnitude; });
        });

        svg.append("g")
            .attr("class", "places")
            .selectAll("path")
            .data(data)
            .enter().append("path")
                .attr("class", "hex")
                .attr("d", function (d) { return hexbin.hexagon() })
                .attr("transform", function (d) { return "translate(" + [d.x, d.y] + ")" })
                .attr("id", function(d) { return d[0].id; })
                .on("mousemove", mousemove)
                .on("mouseover", mouseover)
                .on("mousedown", function () { setMousedown(d3.select(this), true) })
                .on("mouseup", function () { setMousedown(d3.select(this), false) })
                .on("mouseenter", function () { tooltip.style("visibility", "visible"); })
                .on("mouseleave", function () { tooltip.style("visibility", "hidden"); })
                .style("fill", function (d) { return color(d.length); })
                .append("title");

        selected = d3.select(".places").append("use")
            .attr("id", "use")
            .on("mousemove", mousemove)
            .on("mouseover", selectedMouseover)
            .on("mouseenter", function () { tooltip.style("visibility", "visible"); })
            .on("mouseleave", function () { tooltip.style("visibility", "hidden"); });

        fitMapToCanvas(projection, svg);
        controlButtonEnableCheck();
    }

    queue()
        .defer(d3.json, "../files/us-states.json")
        .defer(d3.json, "../files/us-country.json")
        .defer(d3.json, "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson")
        //.defer(d3.json, "http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson")
        .await(ready);


})();