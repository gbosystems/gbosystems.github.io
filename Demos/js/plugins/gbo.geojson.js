(function(window, factory) {
    var gbo = window.gbo = window.gbo || {};

    if (typeof define === 'function' && define.amd) {
        define(['d3'], function(d3) {
            return (gbo.geojson = factory(d3, window));
        });
    } else {
        gbo.geojson = factory(window.d3, window);
    }
}(window, function(d3, window) {
    'use strict';

    var combineColorAndAlpha = function(hexColor, alphaNum) {
        var rgba = "rgba(";
        rgba = rgba.concat(parseInt(hexColor.substring(1,3), 16));
        rgba = rgba.concat(", ");
        rgba = rgba.concat(parseInt(hexColor.substring(3, 5), 16));
        rgba = rgba.concat(", ");
        rgba = rgba.concat(parseInt(hexColor.substring(5), 16));
        rgba = rgba.concat(", ");
        rgba = rgba.concat(Math.round(255 * alphaNum));
        rgba = rgba.concat(")");
        return rgba;
    }

    var geojson = function(config) {
        config = config || {};
        return function (planet) {
            var shapes = [];

            /* Attach methods to plugins namespace */
            planet.plugins.geojson = {
                clearShapes: function () {
                    shapes = [];
                },
                addShape: function (s) {
                    if (typeof s == "string") {
                        d3.json(s, function (data) {
                            shapes.push(data);
                        });
                    } else {
                        shapes.push(s);
                    }
                }
            };

            /* Draw features */
            planet.onDraw(function () {
                if (shapes.length === 0) return;

                planet.withSavedContext(function (context) {
                    for (var i = 0; i < shapes.length; i++) {
                        for (var j = 0; j < shapes[i].features.length; j++) {
                            var feature = shapes[i].features[j];
                            var fillColor = feature.properties["fill"] || "#000000";
                            var fillAlpha = feature.properties["fill-opacity"] || 0.5;
                            var strokeColor = feature.properties["stroke"] || "#000000";
                            var strokeAlpha = feature.properties["stroke-opacity"] || 1.0;

                            if (!(feature.geometry.type === "Polygon" ||
                                feature.geometry.type === "MultiPolygon"))  {
                                context.globalAlpha = feature.properties["stroke-opacity"] || 1;
                            }

                            context.fillStyle = combineColorAndAlpha(fillColor, fillAlpha);
                            context.strokeStyle = combineColorAndAlpha(strokeColor, strokeAlpha);
                            context.lineWidth = feature.properties["stroke-width"] || 1;
                            context.beginPath();
                            planet.path.context(context)(feature);
                            context.stroke();

                            if (feature.geometry.type === "Polygon" ||
                                feature.geometry.type === "MultiPolygon") {
                                context.fill();
                            }
                        } // end for j
                    } // end for i
                });
            });
        };
    };

    return geojson;
}));