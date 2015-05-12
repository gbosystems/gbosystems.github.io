(function () {

    /* Show to "Loading..." overlay */
    gbo.loadingOverlay.show();
    window.addEventListener('resize', function() { gbo.loadingOverlay.align(); });

    /* Modified autocenter plugin (also scales) */
    var autocenter = function (options) {
        options = options || {};
        var needsCentering = false;

        var resize = function (planet) {
            var width = planet.canvas.parentNode.offsetWidth + (options.extraWidth || 0);
            var height = planet.canvas.parentNode.offsetHeight + (options.extraHeight || 0);
            planet.canvas.width = Math.floor(width);
            planet.canvas.height = Math.floor(height);
            planet.projection.translate([width / 2, (height / 2)]);
            planet.projection.scale((Math.min(width, height) / 2) - 10);
        };

        return function (planet) {
            planet.onInit(function () {
                needsCentering = true;
                d3.select(window).on('resize', function () {
                    needsCentering = true;
                });
            });

            planet.onDraw(function () {
                if (needsCentering) {
                    resize(planet);
                    needsCentering = false;
                }
            });
        };
    };

    var noticeColor = function (level) {
        switch (level) {
            case "Warning":
                return "#CE2029";
            case "Alert":
                return "#FCB514";
            case "Watch":
                return "#77933C";
            default:
                return "#FFFFFF";
        }
    }

    var noticeColorDark = function (level) {
        switch (level) {
            case "Warning":
                return "#9B0000";
            case "Alert":
                return "#C98200";
            case "Watch":
                return "#446009";
            default:
                return "#FFFFFF";
        }
    }

    var noticeActionText = function(level) {
        switch(level) {
            case "Warning":
                return "Avoid all non-essential travel to this destination";
            case "Alert":
                return "Follow enhanced precautions for this destination";
            case "Watch":
                return "Reminder to follow usual precautions for this destination";
            default:
                return "";
        }
    }

    var noticeRiskText = function (level) {
        switch (level) {
            case "Warning":
                return "High risk to travelers";
            case "Alert":
                return "Increased risk in defined settings or associated with specific risk factors";
            case "Watch":
                return "Usual baseline risk or slightly above baseline risk for destination and limited impact to the traveler";
            default:
                return "";
        }
    }

    var applyStyleToFeature = function(feature, level) {
        feature.properties["fill"] = noticeColor(level);
        feature.properties["stroke"] = noticeColorDark(level);
        feature.properties["stroke-width"] = 2;
        return feature;
    }

    var getFullHeight = function (elm) {
        var elmHeight, elmMargin;
        if(document.all) {// IE
            elmHeight = elm.currentStyle.height;
            elmMargin = parseInt(elm.currentStyle.marginTop, 10) + parseInt(elm.currentStyle.marginBottom, 10);
        } else {// Mozilla
            elmHeight = elm.offsetHeight;
            elmMargin = parseInt(window.getComputedStyle(elm).getPropertyValue('margin-top')) + parseInt(window.getComputedStyle(elm).getPropertyValue('margin-bottom'));
        }
        return (elmHeight+elmMargin);
    }

    var resizeElementToFillRemainingHeight = function (parent, child) {
        var totalHeight = parent.property("offsetHeight");
        var childrenHeight = 0;
        var children = parent.property("children");

        for (var i = 0; i < children.length; i++) {
            if (children[i] !== child[0][0])
                childrenHeight += getFullHeight(children[i]);
        }

        child.style("height", (totalHeight - childrenHeight) + "px");
    }

    var autoScroll = function(element) {
        element.transition("autoscroll")
            .duration(10000)
            .ease("linear")
            .tween("scroll", function() {
                var r = d3.interpolateNumber(0, element.property("scrollTopMax"));
                return function (t) {
                    element.property("scrollTop", r(t));
                };
            });
    }

    function ready(error, world, notices) {

        var canvas = document.getElementById('map');
        var title = d3.select("div.sidebar-content").append("h3");
        d3.select("div.sidebar-content").append("h4").text("Description");
        var description = d3.select("div.sidebar-content").append("p");
        d3.select("div.sidebar-content").append("h4").text("Traveler Action");
        var action = d3.select("div.sidebar-content").append("div");
        d3.select("div.sidebar-content").append("h4").text("Risk to Traveler");
        var risk = d3.select("div.sidebar-content").append("div");

        var source = d3.select("div.sidebar-footer").append("div").text("Centers for Disease Control and Prevention");
        var date = d3.select("div.sidebar-footer").append("div");

        var wrapper = d3.select("div.content");
        var planet = planetaryjs.planet();

        var resizeDescription = function() {
            resizeElementToFillRemainingHeight(
                d3.select("div.sidebar-content"),
                description
            );
            autoScroll(description);
        };

        planet.loadPlugin(planetaryjs.plugins.earth({
            topojson: { world: world },
            oceans: { fill: '#001320' },
            land: { fill: '#06304e' },
            borders: { stroke: '#001320' }
        }));
        planet.loadPlugin(autocenter({ extraHeight: -8, extraWidth: -8 }));
        planet.loadPlugin(gbo.geojson());
        planet.draw(canvas);

        gbo.loadingOverlay.hide();

        var countries = topojson.feature(world, world.objects.countries).features;
        var i = 0;
        var n = notices.length;

        var country = function (id) {
            for (var i = 0; i < countries.length; i++) {
                if (countries[i].id === id) {
                    return countries[i];
                }
            }
            return null;
        };

        var setNoticeText = function (notice) {
            title.text(notice.Name);
            wrapper.style("border-left-color", noticeColor(notice.Level));
            description.text(notice.Description);
            action.text(noticeActionText(notice.Level));
            risk.text(noticeRiskText(notice.Level));
            date.text(notice.Date);
            resizeDescription();
        }

       var currentCountry;

        (function transition() {
            d3.transition()
                .duration(1250)
                .each("start", function () {
                    var iStart = i;
                    i = (i + 1) % n;
                    while ((currentCountry = country(notices[i].CountryId)) === null) {
                        i = (i + 1) % n;
                        if (i === iStart) {
                            throw new Error("There is an error in the notice data.");
                        }
                    }
                    currentCountry = applyStyleToFeature(currentCountry, notices[i].Level);
                })
                .tween("rotate", function () {
                    planet.plugins.geojson.clearShapes();
                    planet.plugins.geojson.addShape({ type: "FeatureCollection", features: [ currentCountry ] });
                    setNoticeText(notices[i]);
                    var p = d3.geo.centroid(currentCountry);
                    var r = d3.interpolate(planet.projection.rotate(), [-p[0], -p[1]]);

                    return function (t) {
                        planet.projection.rotate(r(t));
                    };
                })
                .transition()
                .delay(10000)
                .transition()
                .each("end", transition);
        })();

    }



    queue()
        .defer(d3.json, "../files/world-110m.json")
        .defer(d3.json, "notices.json")
        .await(ready);

    


})();