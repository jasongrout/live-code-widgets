/* Modified from a d3.js example at http://bl.ocks.org/mbostock/929623 */

(function() {
    window.GraphEditor = function GraphEditor(node, options) {
        var options = options || {};
        var width  = options.width || 300;
        var height = options.height || 300;

        var fill = d3.scale.category20();

        var force = d3.layout.force()
            .size([width, height])
            .nodes([{}]) // initialize with a single node
            .linkDistance(30)
            .charge(-60)
            .on("tick", tick);

        var svg = d3.select(node).append("svg")
            .attr("width", width)
            .attr("height", height)
            .on("mousemove", mousemove)
            .on("mousedown", mousedown);

        svg.append("rect")
            .attr("width", width)
            .attr("height", height);

        var nodes = force.nodes();
        var links = force.links();
        var obj = {nodes: nodes, links: links};
        var node = svg.selectAll(".node");
        var link = svg.selectAll(".link");

        var cursor = svg.append("circle")
            .attr("r", 30)
            .attr("transform", "translate(-100,-100)")
            .attr("class", "cursor");

        restart();

        function mousemove() {
            cursor.attr("transform", "translate(" + d3.mouse(this) + ")");
        }

        function mousedown() {
            d3.event.stopPropagation();
            var point = d3.mouse(this),
            node = {x: point[0], y: point[1]},
            n = nodes.push(node);

            // add links to any nearby nodes
            nodes.forEach(function(target) {
                var x = target.x - node.x,
                y = target.y - node.y,
                distance = Math.sqrt(x*x+y*y);
                
                if (distance>.1 && distance < 30) {
                    links.push({source: node, target: target});
                }
            });
            obj.changed && obj.changed();
            restart();
        }

        function tick() {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
        }

        function restart() {
            link = link.data(links);

            link.enter().insert("line", ".node")
                .attr("class", "link");

            node = node.data(nodes);

            node.enter().insert("circle", ".cursor")
                .attr("class", "node")
                .attr("r", 5)
                .call(force.drag);
            force.start();
        }
        return obj;
    }
})();