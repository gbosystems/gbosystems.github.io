(function (window, factory) {
    var gbo = window.gbo = window.gbo || {};

    if (typeof define === 'function' && define.amd) {
        define(['d3'], function (d3) {
            return (gbo.loadingOverlay = factory(d3, window));
        });
    } else {
        gbo.loadingOverlay = factory(window.d3, window);
    }
}(window, function (d3, window) {
    'use strict';

    function Overlay() {

        var loadingId = "loading-overlay";
        var loadingElement = null;
        var animatedId = "animated-overlay";
        var animatedElement = null;
        var animatedInterval = null;
        var active = false;

        Overlay.prototype.windowHeight = function() {
            return "innerHeight" in window
               ? window.innerHeight
               : document.documentElement.offsetHeight;
        };

        Overlay.prototype.windowWidth = function () {
            return "innerWidth" in window
               ? window.innerWidth
               : document.documentElement.offsetWidth;
        };

        Overlay.prototype.loadingHeight = function() {
            return document.getElementById(loadingId).clientHeight;
        };

        Overlay.prototype.loadingWidth = function () {
            return document.getElementById(loadingId).clientWidth;
        };

        Overlay.prototype.align = function() {
            if (active === false) return;

            loadingElement.style("top", ((this.windowHeight() - this.loadingHeight()) / 2 ) + "px");
            animatedElement.style("top", ((this.windowHeight() - this.loadingHeight()) / 2) + "px");

            loadingElement.style("left",  ((this.windowWidth() - this.loadingWidth()) / 2) + "px");
            animatedElement.style("left", ((this.windowWidth() + this.loadingWidth()) / 2) + "px");
        };

        Overlay.prototype.show = function() {

            loadingElement = d3.select("body")
                .append("div")
                .attr("id", loadingId)
                .style("position", "absolute")
                .style("font-size", "7em")
                .text("Loading");

            animatedElement = d3.select("body")
                .append("div")
                .attr("id", animatedId)
                .style("position", "absolute")
                .style("font-size", "7em")
            .text(".");

            active = true;

            this.align();

            var count = 0;
            animatedInterval = setInterval(function() {
                count = (count + 1) % 4;
                var text = "";
                for (var i = 0; i < count; i ++) {
                    text += ".";
                }
                animatedElement.text(text);
            }, 400);
        };

        Overlay.prototype.hide = function() {
            active = false;
            clearInterval(animatedInterval);
            loadingElement.remove();
            animatedElement.remove();
        };

    };

    return new Overlay();
}));