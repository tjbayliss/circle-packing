console.log("selector-page.js");

// project-specific var declarations ...
var pearlData = {};
pearlData.layerIsSelected = false;
pearlData.topicsToDisable = [];

document.addEventListener(
  "DOMContentLoaded",
  function () {
    buildSelectionPage();
  },
  false
);

function buildSelectionPage() {
  console.log("buildSelectionPage");
  console.log("d3.version", d3.version);

  var path = "/data/topic0_subtopic0_topics.json";
  var files = [path];
  var promises = [];

  files.forEach(function (url) {
    promises.push(d3.json(url));
  });

  Promise.all(promises)
    .then(function (values) {
      var topics = values[0];

      // http://bl.ocks.org/jfreels/6734823
      var select = d3
        .selectAll(".topic-selection-form")
        .append("select")
        .attr("class", "select")

        .on("change", onchange);

      var options = select
        .selectAll("option")
        .data(topics)
        .enter()
        .append("option")
        .attr("class", function (d, i) {
          return "option" + " " + d.name.replaceAll(" ", "-");
        })
        .attr("id", function (d, i) {
          return "option-" + d.name.replaceAll(" ", "-");
        })
        .attr("value", function (d, i) {
          return d.name;
        })
        .attr("disabled", function (d, i) {
          if (pearlData.topicsToDisable.indexOf(d.name) != -1) {
            return true;
          }
        })
        .text(function (d) {
          return d.name;
        });

      select
        // <option value="" disabled selected hidden>Choose Gender...</option>
        .append("option")
        .attr("value", "")
        .attr("disabled", true)
        .attr("selected", true)
        .attr("hidden", true)
        .text("Select a Topic");

      function onchange() {
        selectedTopic = d3.select("select").property("value");

        d3.selectAll(".mask").classed("hide", true);
        d3.selectAll(".container").classed("hide", false);

        var files = ["data/" + selectedTopic + "/researchersCommunity10.json"];
        var promises = [];

        files.forEach(function (url) {
          promises.push(d3.json(url));
        });

        Promise.all(promises)
          .then(function (data) {
            pearlData.sourceData = data[0];

            pearlData.sourceData.forEach(function (d, i) {
              d.authorID = i;
            });

            console.log(pearlData.sourceData);
            nestData();
          })
          .catch(function (error) {
            // Do some error handling.
            console.log("error!:", error);
          });
      }
    })
    .catch(function (error) {
      // Do some error handling.
      console.log("error!:", error);
    });
  return;
} // end function buildSelectionPage()
