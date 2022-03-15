/*
  PROTOTYPE COMMENTS:

  - currently built in d3 v5
  - build based on this example version code: https://bl.ocks.org/mbostock/7607535


  TO DOs:
  - add to instructions text
  - fully comment code
*/

// console.log("PEARL - Zoomable Circle Packing");

var pearlData = {
  topicsToDisable: ["Computational Social Science", "Scientific Reports"],
  articles: [],
  authors: [],
  topic: "Black holes" /* "aerogels" */ /* "black holes" */,
  /*  hierarchy: ["Continent", "Country", "Institute"], */
  hierarchy: ["countries", "affiliation", "year"],
};
var promises = [];
let selected;
var nodes;
var margin = 75;
var view;
var focus;
var diameter;
var node;
var circle;

var w = innerWidth;
var h = innerHeight;
// console.log(w, h);

// create a tooltip
var Tooltip = d3
  .select("#container")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip")
  .style("background-color", "white")
  .style("border", "solid")
  .style("border-width", "1px")
  .style("border-radius", "0px")
  .style("width", "150px")
  .style("z-index", 100)
  .style("position", "absolute")
  .style("padding", "5px")
  .style("font-size", "12px")
  .style("pointer-events", "none");

function nestData() {
  /*
          NAME: rename 
          DESCRIPTION: function called to rename JSON object keys to desired names
          ARGUMENTS TAKEN: value - key name
          ARGUMENTS RETURNED: none
          CALLED FROM: submitSelection
          CALLS: rename
    */
  function rename(value) {
    if (!value || typeof value !== "object") {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map(rename);
    }

    var dee = Object.fromEntries(
      Object.entries(value).map(([k, v]) => [keys[k] || k, rename(v)])
    );

    if (!dee.name) {
      console.log(dee);
      return {
        authorID: dee.authorID,
        name: /* dee.researcher_id */ dee.last_name + ", " + dee.first_name,
        author: dee.last_name + ", " + dee.first_name,
        researcher_id: dee.researcher_id,
        community: dee.community,
        pagerank: dee.pagerank,
        first_name: dee.first_name,
        last_name: dee.last_name,
        year: dee.year,
        children: [],
        size: dee.articles,
      };
    } else {
      return dee;
    }
  } // end function rename

  // key-value object to define required JSON object names.
  var keys = {
    key: "name",
    values: "children",
  };

  // console.log(pearlData.sourceData);
  // console.log(pearlData.hierarchy);
  /*
    NAME: createNestingFunction 
    DESCRIPTION: recursive function to build required JSON object
    ARGUMENTS TAKEN: propertyName - key name
    ARGUMENTS RETURNED: d[propertyName]
    CALLED FROM: submitSelection
    CALLS: none
  */
  function createNestingFunction(propertyName) {
    return function (d) {
      return d[propertyName];
    };
  } // end function createNestingFunction

  // https://stackoverflow.com/questions/22512853/d3-js-use-d3-nest-adding-keys-dynamically
  var levels = pearlData.hierarchy.map(function (d, i) {
    // // console.log(d);
    return d;
  });

  // console.log(levels, selectedTopic);

  // generate D3 nest object based on data recursion
  var nest = d3.nest();
  for (var i = 0; i < levels.length; i++) {
    nest = nest.key(createNestingFunction(levels[i]));
  }

  // construct updated structure for aleph tree object
  pearlData.treeData = {
    name: selectedTopic,
    children: rename(nest.entries(pearlData.sourceData)), //compute the nest
  };

  // console.log(pearlData.treeData);

  pearlData.sourceData.forEach(function (d, i) {
    // var author = d.last_name + ", " + d.first_name;
    // if (pearlData.authors.indexOf(author) == -1) {
    d.authorID = +i;
    d.author = d.last_name + ", " + d.first_name;
    // pearlData.authors.push([d.authorID, author]);
    // }

    // if (pearlData.articles.indexOf(d.researcher_id) == -1) {
    pearlData.articles.push(d.researcher_id);

    d3.selectAll(".article-selector")
      .append("option")
      .attr("value", d.authorID)
      .text(d.researcher_id);
    // }
  });

  // pearlData.authors.sort();

  pearlData.sourceData.sort(function (a, b) {
    return a.author > b.author ? 1 : -1;
  });
  // pearlData.sourceData.sort((a, b) => a.author - b.author);

  console.log(pearlData.sourceData);

  d3.selectAll(".author-selector")
    .selectAll("option")
    .data(/* pearlData.authors */ pearlData.sourceData)
    .enter()
    .append("option")
    .attr("value", function (d, i) {
      return /* +d[0] */ d.authorID;
    })
    .text(function (d, i) {
      // d.authorID

      return /* d[1] */ d.author;
    });

  drawChart(pearlData.treeData);

  return;
} // end function nestData

function drawChart(root) {
  // console.log(root);
  var svg = d3.select("svg").attr("width", w).attr("height", h);
  /* margin = 10, */
  diameter = +svg.attr("height") - margin * 2;
  var g = svg
    .append("g")
    .attr(
      "transform",
      "translate(" + w /* diameter */ / 2 + "," + h /* diameter */ / 2 + ")"
    );

  var color = d3
    .scaleLinear()
    .domain([-1, 5])
    .range(["#f7f7f7", "#252525"])
    .interpolate(d3.interpolateHcl);

  var pack = d3
    .pack()
    .size([diameter - margin, diameter - margin])
    .padding(2);

  root = d3
    .hierarchy(root)
    .sum(function (d) {
      return d.size;
    })
    .sort(function (a, b) {
      return b.value - a.value;
    });

  focus = root;
  nodes = pack(root).descendants();

  circle = g
    .selectAll("circle")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("id", function (d, i) {
      return;
    })
    .attr("class", function (d) {
      // console.log(d);

      // return d.parent
      //   ? d.children
      //     ? "node"
      //     : "node node--leaf"
      //   : "node node--root";

      return d.parent
        ? d.children
          ? "node"
          : "authorID-" + d.data.authorID + " node node--leaf"
        : "node node--root";
    })
    .style("fill", function (d) {
      return d.children ? color(d.depth) : null;
    })
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .on("click", function (d, i) {
      if (focus !== d) zoom(d), d3.event.stopPropagation();
    });

  var text = g
    .selectAll("text")
    .data(nodes)
    .enter()
    .append("text")
    .attr("class", "label")
    .style("fill-opacity", function (d) {
      return d.parent === root ? 1 : 0;
      // return d.parent === root ? 1 : 1;
    })
    .style("display", function (d) {
      return d.parent === root ? "inline" : "none";
      // return d.parent === root ? "inline" : "inline";
    })
    .text(function (d) {
      return d.data.name /* author */;
    });

  node = g.selectAll("circle,text");

  svg.style("background", "#FFF").on("click", function () {
    zoom(root);
  });

  d3.select("#reset").on("click", function () {
    zoom2(root);
  });

  zoomTo([root.x, root.y, root.r * 2 + margin]);

  function zoom(d) {
    var focus0 = focus;
    focus = d;

    var transition = d3
      .transition()
      .duration(d3.event.altKey ? 7500 : 750)
      .tween("zoom", function (d) {
        var i = d3.interpolateZoom(view, [
          focus.x,
          focus.y,
          focus.r * 2 /*  + margin */,
        ]);
        return function (t) {
          zoomTo(i(t));
        };
      });

    transition
      .selectAll("text")
      .filter(function (d) {
        return d.parent === focus || this.style.display === "inline";
      })
      .style("fill-opacity", function (d) {
        return d.parent === focus ? 1 : 0;
      })
      .on("start", function (d) {
        if (d.parent === focus) this.style.display = "inline";
      })
      .on("end", function (d) {
        if (d.parent !== focus) this.style.display = "none";
      });
  }

  function zoomTo(v) {
    // // console.log("Original zoomTo:", v);
    var k = diameter / v[2];
    view = v;
    // // console.log(node);
    node.attr("transform", function (d) {
      return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
    });
    circle.attr("r", function (d) {
      return d.r * k;
    });
  }
} // end function drawChart

function submitNewHierarchy(fid) {
  // // console.log(fid);

  var level1 = document.getElementById("level1").value;
  var level2 = document.getElementById("level2").value;
  var level3 = document.getElementById("level3").value;

  // // console.log(level1, level2, level3);
  pearlData.hierarchy = [level1, level2, level3];
  // // console.log(level1, level2, level3, pearlData.hierarchy);

  nestData();

  return;
} // end function submitNewHierarchy

function findFunction(fid) {
  // console.log(fid, fid.id);
  var altID;

  if (fid.id == "author-selector") {
    altID = "article-selector";
  } else {
    altID = "author-selector";
  }

  var selector = document.getElementById(fid.id);
  // console.log("selector value:", "authorID-" + selector.value);
  // console.log("altID:", altID, selector.value);

  document.getElementById(altID).value = "none";

  d3.selectAll(".node.node--leaf")
    .classed("author-selector", false)
    .classed("article-selector", false);

  // console.log();

  d3.selectAll(".node.node--leaf.authorID-" + selector.value).classed(
    fid.id,
    true
  );

  var selectedNode, nodeID;
  // var selectedNode;

  nodes.forEach(function (d, i) {
    selectedNode = d;
    nodeID = d.data.authorID;
    if (selector.value == nodeID) {
      // console.log("selector.value:", selector.value, "  nodeID:", nodeID);
      zoom2(selectedNode);
    }
  });

  return;
} // end function FindFunction

d3.selection.prototype.moveToFront = function () {
  return this.each(function () {
    this.parentNode.appendChild(this);
  });
};

d3.selection.prototype.moveToBack = function () {
  return this.each(function () {
    var firstChild = this.parentNode.firstChild;
    if (firstChild) {
      this.parentNode.insertBefore(this, firstChild);
    }
  });
};

// Three function that change the tooltip when user hover / move / leave a cell
var mouseover = function (d, i) {
  Tooltip.style("opacity", /* 1 */ 0);
};

var mousemove = function (d, i) {
  // console.log(this);
  var text = "This node is: </br><b>" + d.data.name + "</b></br></br>";

  Tooltip.html(text)
    .style("left", d.x /*  - -d3.mouse(this)[0] */ + 10 + "px")
    .style("top", d.y /* - -d3.mouse(this)[1] */ - 10 + "px");
  var coordinates = d3.mouse(this);
  var x = coordinates[0];
  var y = coordinates[1];

  var xy = d3.mouse(this);

  var transform = d3.zoomTransform(circle.node());
  var xy1 = transform.invert(xy);

  // console.log("Mouse:[", xy[0], xy[1], "] Zoomed:[", xy1[0], xy1[1], "]");
};

var mouseleave = function (d, i) {
  Tooltip.style("opacity", 0);
};

function zoom2(d) {
  var focus0 = focus;
  focus = d;

  // console.log(focus);

  var transition = d3
    .transition()
    .duration(750)
    .tween("zoom", function (d) {
      var i = d3.interpolateZoom(view, [
        focus.x,
        focus.y,
        focus.r * 2 /*  + margin */,
      ]);
      return function (t) {
        var v = i(t);

        var k = diameter / v[2];
        view = v;
        node.attr("transform", function (d) {
          return "translate(" + (d.x - v[0]) * k + "," + (d.y - v[1]) * k + ")";
        });
        circle.attr("r", function (d) {
          return d.r * k;
        });
      };
    });

  transition
    .selectAll("text")
    .filter(function (d) {
      return d.parent === focus || this.style.display === "inline";
    })
    .style("fill-opacity", function (d) {
      return d.parent === focus ? 1 : 0;
    })
    .on("start", function (d) {
      if (d.parent === focus) this.style.display = "inline";
    })
    .on("end", function (d) {
      if (d.parent !== focus) this.style.display = "none";
    });

  return;
} // end function zoom2
