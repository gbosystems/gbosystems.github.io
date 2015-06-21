(function(window, d3) {
    window.iconFactory = {};
    window.iconFactory.new = function(parent, id) {

        switch (id) {
            case "pin":
                var svg = parent.append("svg")
                    .attr("height", "16px")
                    .attr("width", "16px")
                    .attr("viewBox", "0 0 16 16");

                svg.append("g")
                    .attr("fill-rule", "evenodd")
                    .attr("stroke", "none")
                    .attr("stroke-width", "1")
                    .append("g")
                        .attr("transform", "translate(-240.000000, -192.000000)")
                        .append("path")
                            .attr("d", "M247,201 L249,201 L249,207 L248,208 L247,207 Z M248,200 C245.790861,200 244,198.209139 244,196 C244,193.790861 245.790861,192 248,192 C250.209139,192 252,193.790861 252,196 C252,198.209139 250.209139,200 248,200 Z M247,196 C247.552285,196 248,195.552285 248,195 C248,194.447715 247.552285,194 247,194 C246.447715,194 246,194.447715 246,195 C246,195.552285 246.447715,196 247,196 Z M247,196")
                            .attr("id", "Rectangle 160");

            return svg;
        default:
            return document.createElement("svg");
        }
    };

})(window, d3);