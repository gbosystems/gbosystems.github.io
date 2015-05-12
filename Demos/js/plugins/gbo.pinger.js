/*  Name: Pinger
 *  Description : A planetaryjs plugin for managing pings via
 *                a GeoJSON FeatureCollection.
 *  Copyright (c) 2015 Geoff O'Donnell
 *  Released under the MIT license
 */

(function (window, factory) {
    var gbo = window.gbo = window.gbo || {};

    if (typeof define === 'function' && define.amd) {
        define(['d3'], function(d3) {
            return (gbo.pinger = factory(d3, window));
        });
    } else {
        gbo.pinger = factory(window.d3, window);
    }
}(window, function(d3, window) {
    'use strict';

    var pinger = function(config) {
        config = config || {};
        config.interval = config.interval || 5000;

        return function (planet) {
            var intervals = [];
            var handleManifest = function (m) {
                if (!planet.plugins.pings) {
                    console.log("pinger: pings plugin must be enabled.");
                    return;
                }
                if (m.type !== "FeatureCollection") {
                    throw new Error("pinger: manifest must be a GeoJSON FeatureCollection");
                }

                for (var i = 0; i < m.features.length; i++) {
                    var configuration = {};
                    var feature = m.features[i];
                    feature.properties.interval = feature.properties.interval || config.interval;
                    if (feature.type !== "Feature") continue;
                    if( feature.geometry.type !== "Point") continue;
                    if (feature.properties.ttl) {
                        configuration.ttl = feature.properties.ttl;
                    }
                    if (feature.properties.color) {
                        configuration.color = feature.properties.color;
                    }
                    if (feature.properties.angle) {
                        configuration.angle = feature.properties.angle;
                    }

                    intervals.push(
                        window.setInterval(
                            planet.plugins.pings.add,
                            feature.properties.interval,
                            feature.geometry.coordinates[0],
                            feature.geometry.coordinates[1],
                            configuration)
                    );
                }
            };

            /* Attach methods to plugins namespace */
            planet.plugins.pinger = {
                clear: function () {
                    for (var i = 0; i < intervals.length; i++) {
                        window.clearInterval(intervals[i]);
                    }
                    intervals = [];
                },
                setManifest: function (s) {
                    planet.plugins.pinger.clear();
                    if (typeof s == "string") {
                        d3.json(s, function (data) {
                            handleManifest(data);
                        });
                    } else {
                        handleManifest(s);
                    }
                }
            };
        };
    };

    return pinger;
}));