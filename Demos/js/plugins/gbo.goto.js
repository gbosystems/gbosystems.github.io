/*  Name: Goto
 *  Copyright (c) 2015 Geoff O'Donnell
 *  Released under the MIT license
 */

(function (window, factory) {
    var gbo = window.gbo = window.gbo || {};
    gbo.planetaryjs = gbo.planetaryjs || {};

    if (typeof define === 'function' && define.amd) {
        define(['d3'], function(d3) {
            return (gbo.planetaryjs.goTo = factory(d3, window));
        });
    } else {
        gbo.planetaryjs.goTo = factory(window.d3, window);
    }
}(window, function(d3, window) {
    'use strict';

    var goTo = function (config) {
        config = config || {};
        var zoomInTo = config.zoomInTo || 300;
        var zoomOutTo = config.zoomOutTo || 50;
        var zoomSpeed = config.zoomSpeed || 50;
        var rotationSpeed = config.rotationSpeed || 30;

        var transitioner = {
            stages: [],
            lastTick: null,
            transition: function () {
                if (this.stages.length === 0) {
                    return;
                }

                if (!this.lastTick) {
                    this.lastTick = new Date();
                } else if (this.stages[0](this.lastTick)) {
                    this.stages.shift();
                }

                if (this.stages.length === 0) {
                    this.lastTick = null;
                } else {
                    this.lastTick = new Date();
                }
            }
        };

        var zoomTo = function(lastTick, zoom) {
            var now = new Date();
            var timeDelta = now - lastTick;
            var scaleDelta = zoomSpeed * timeDelta / 1000;
            var scale = planet.projection.scale();
            var diff = Math.abs(scale - zoom);
            if (diff < scaleDelta) {
                planet.projection.scale(zoom);
                return true;
            } else if (scale - zoom > 0) {
                planet.projection.scale(scale - scaleDelta);
            } else {
                planet.projection.scale(scale + scaleDelta);
            }
            return false;
        }

        var rotateTo = function (lastTick, location) {
            var now = new Date();
            var timeDelta = now - lastTick;
            var rotation = planet.projection.rotate();
            var rotationDelta = rotationSpeed * timeDelta / 1000;
            var xDiff = Math.abs(rotation[0] - location[0]);
            var yDiff = Math.abs(rotation[1] - location[1]);

            if (xDiff < rotationDelta) {
                rotation[0] = location[0];
            } else if (rotation[0] - location[0] > 0) {
                rotation[0] -= rotationDelta;
            } else {
                rotation[0] += rotationDelta;
            }

            if (yDiff < rotationDelta) {
                rotation[1] = location[1];
            } else if (rotation[1] - location[1] > 0) {
                rotation[1] -= rotationDelta;
            } else {
                rotation[1] += rotationDelta;
            }

            if (rotation[0] >= 180) rotation[0] -= 360;
            if (rotation[1] >= 90) rotation[1] -= 180;

            planet.projection.rotate(rotation);

            return (rotation[0] === location[0] && rotation[1] === location[1]);
        }

        return function (planet) {
            planet.onDraw(function () {
                transitioner.transition();
            });

            /* Attach methods to plugins namespace */
            planet.plugins.goto = {
                location: function (loc, zoomSettings) {
                    loc[0] = loc[0] * -1;
                    loc[1] = loc[1] * -1;
                    zoomSettings = zoomSettings || {};
                    var zoomOut = zoomSettings.zoomOutTo || zoomOutTo;
                    var zoomIn = zoomSettings.zoomInTo || zoomInTo;

                    transitioner.stages.push(function (lastTick) { return zoomTo(lastTick, zoomOut); });
                    transitioner.stages.push(function (lastTick) { return rotateTo(lastTick, loc); });
                    transitioner.stages.push(function (lastTick) { return zoomTo(lastTick, zoomIn); });
                },
                location2 : function(p) {
                    d3.transition()
                        .duration(1250)
                        .tween("rotate", function() {
                            var r = d3.interpolate(planet.projection.rotate(), [-p[0], -p[1]]);
                            return function(t) {
                                planet.projection.rotate(r(t));
                            };
                        })
                    .transition();

                }
            };
        };
    };

    return goTo;
}));