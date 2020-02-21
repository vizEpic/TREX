// "Anonymous function" - Triggered on document ready.  Perform an initialize, call function to check for saved settings / draw chart, add event listeners
var select2Data = [];
var searchField;
var searchText;
var arrValue = [];
var arrValue1 = [];
var arrValue2 = [];
var arrValue3 = [];
var arrValue4 = [];
var arrValue5 = [];
var hierarchy;
var HierType;
var Level1;
var Level2;
var Level3;
var Level4;
var Level5;
var LevelDeep;
var DelimiterChosen;
var showLabel;

(function () {
  let unregisterHandlerFunctions = [];
  $(document).ready(function () {
    // Initialize the extension and pass in a special keyword of "configure" which is needed in order to link the main page and config page together
    tableau.extensions.initializeAsync({ 'configure': configure }).then(function () {
      getDataIntoJSON();
    });

    // Call the configure function on a trigger of configure button onClick
    $(function () {
      $('#configure').click(function () {
        configure();
      });
    });
  });

  // "Configure function" - Open a modal configure HTML page and pass a default pay load
  function configure() {
    if ((String(location).includes("localhost:8765")) == false)
      var popupUrl = location + '/nodeTreeCompactDialog.html';
    else
      var popupUrl = `${window.location.origin}/nodeTreeCompact/nodeTreeCompactDialog.html`;
    var defaultPayload = "";

    tableau.extensions.ui.displayDialogAsync(popupUrl, defaultPayload, { height: 652, width: 750 }).then((closePayload) => {
      getDataIntoJSON();
    });
  }

  // "getDataIntoJSON function" - On document ready and anytime that the dialog is closed, check for settings and draw the chart
  function getDataIntoJSON() {
    // Get the worksheets within the dashboard
    const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;

    // Get all saved settings
    var worksheetName = tableau.extensions.settings.get("selectWorksheet");
    var DimensionChosenColumn = tableau.extensions.settings.get("DimensionChosenColumn");
    var MeasureChosenColumn = tableau.extensions.settings.get("MeasureChosenColumn");
    DelimiterChosen = tableau.extensions.settings.get("DelimiterChosen");
    showLabel = tableau.extensions.settings.get("ShowMeasureLabel");

    HierType = tableau.extensions.settings.get("HierarchyType");
    Level1 = tableau.extensions.settings.get("Level1");
    Level2 = tableau.extensions.settings.get("Level2");
    Level3 = tableau.extensions.settings.get("Level3");
    Level4 = tableau.extensions.settings.get("Level4");
    Level5 = tableau.extensions.settings.get("Level5");

    if (worksheetName > ' ') {
      $('#wrapper').hide();
      $('#wrapper2').show();

      var worksheet = worksheets.find(function (sheet) {
        return sheet.name === worksheetName;
      });

      worksheet.getSummaryDataAsync().then(function (sumdata) {
        var sumarr = [];
        var data = [];

        if (HierType == 'parent_child') {
          // Loop sumdata and write out the selected dimension and measure values to sumarr
          for (var l1 = 0; l1 < sumdata.data.length; l1++) {
            var l2 = 0;
            sumarr.push(['', '']);
            sumdata.columns.forEach(function (current_value) {
              if (current_value.fieldName == DimensionChosenColumn) {
                sumarr[l1][0] = sumdata.data[l1][l2].formattedValue;
              }
              if (current_value.fieldName == MeasureChosenColumn) {
                sumarr[l1][1] = sumdata.data[l1][l2].value;
              }
              l2++;
            });
          }
          sumarr.sort();

          // Convert to JSON format
          for (var l5 = 0; l5 < sumarr.length; l5++) {
            data.push({ "id": sumarr[l5][0], "value": sumarr[l5][1] });
          }

          var stratify = d3.stratify()
            .parentId(function (d) { return d.id.substring(0, d.id.lastIndexOf(DelimiterChosen)); });

          var rootz = stratify(data)
            .sort(function (a, b) { return (a.height - b.height) || a.id.localeCompare(b.id); });
        }
        else {
          for (var l1 = 0; l1 < sumdata.data.length; l1++) {
            var l2 = 0;
            sumarr.push(['', '', '', '', '', '']);
            sumdata.columns.forEach(function (current_value) {
              if (current_value.fieldName == Level1) {
                sumarr[l1][0] = sumdata.data[l1][l2].formattedValue;
              }
              if (current_value.fieldName == Level2) {
                sumarr[l1][1] = sumdata.data[l1][l2].formattedValue;
              }
              if (current_value.fieldName == Level3) {
                sumarr[l1][2] = sumdata.data[l1][l2].formattedValue;
              }
              if (current_value.fieldName == Level4) {
                sumarr[l1][3] = sumdata.data[l1][l2].formattedValue;
              }
              if (current_value.fieldName == Level5) {
                sumarr[l1][4] = sumdata.data[l1][l2].formattedValue;
              }
              if (current_value.fieldName == MeasureChosenColumn) {
                sumarr[l1][5] = sumdata.data[l1][l2].value;
              }
              l2++;
            });
          }
          sumarr.sort();

          // Convert to JSON format
          if (Level5 != 'NA') {
            for (var l5 = 0; l5 < sumarr.length; l5++) {
              data.push({ "level1": sumarr[l5][0], "level2": sumarr[l5][1], "level3": sumarr[l5][2], "level4": sumarr[l5][3], "level5": sumarr[l5][4], "value": sumarr[l5][5] });
            }
            const levels = ["level1", "level2", "level3", "level4"];
            hierarchy = flatToHierarchy(data, levels, 'level5', 'value');
          }
          else {
            if (Level4 != 'NA') {
              for (var l5 = 0; l5 < sumarr.length; l5++) {
                data.push({ "level1": sumarr[l5][0], "level2": sumarr[l5][1], "level3": sumarr[l5][2], "level4": sumarr[l5][3], "value": sumarr[l5][5] });
              }
              const levels = ["level1", "level2", "level3"];
              hierarchy = flatToHierarchy(data, levels, 'level4', 'value');
            }
            else {
              for (var l5 = 0; l5 < sumarr.length; l5++) {
                data.push({ "level1": sumarr[l5][0], "level2": sumarr[l5][1], "level3": sumarr[l5][2], "value": sumarr[l5][5] });
              }
              const levels = ["level1", "level2"];
              hierarchy = flatToHierarchy(data, levels, 'level3', 'value');

            }
          }
          var rootz = hierarchy;
        }
        drawChart(rootz, worksheet, DimensionChosenColumn);
      });
    }
  }

  function flatToHierarchy(flatData, levels, nameField, countField) {
    var nestedData = { id: "root", filter: 'ALL', children: [] }

    flatData.forEach(function (d) {
      var depthCursor = nestedData.children;
      levels.forEach(function (property, depth) {
        var index;
        depthCursor.forEach(function (child, i) {
          if (d[property] == child.id) index = i;
        });
        if (isNaN(index)) {
          depthCursor.push({ id: d[property], filter: property, children: [] });
          index = depthCursor.length - 1;
        }
        depthCursor = depthCursor[index].children;
        if (depth === levels.length - 1) {
          depthCursor.push({
            'id': d[nameField],
            'filter': nameField,
            'count': +d[countField]
          });
        }
      })
    })

    return d3.hierarchy(nestedData).sum(function (d) { return d.count; });
  }

  function drawChart(flatdata, worksheet, DimensionChosenColumn) {
    var tree = d3.tree;
    var hierarchy = d3.hierarchy;
    var select = d3.select;

    var MyTree = /** @class */function () {
      function MyTree() {
        var _this = this;

        this.connector = function (d) {
          return "M" + d.parent.y + "," + d.parent.x +
            "V" + d.x + "H" + d.y;
        };
        this.collapse = function (d) {
          if (d.children) {
            d._children = d.children;
            d._children.forEach(_this.collapse);
            d.children = null;
          }
        };

        this.click = function (d) {
          toggle(d, 'n');
        };

        process_data(flatdata);

        function process_data(f_data) {
          select2DataCollectName(f_data);
          select2Data.sort();

          var select2DataObject = [];
          select2Data.sort(function (a, b) {
            if (a > b) return 1; // sort
            if (a < b) return -1;
            return 0;
          })
            .filter(function (item, i, ar) {
              return ar.indexOf(item) === i;
            }) // remove duplicate items
            .filter(function (item, i, ar) {
              select2DataObject.push({
                "id": i,
                "text": item
              });
            });
          $("#searchName").select2({
            data: select2DataObject,
            containerCssClass: "search"
          });

        }

        d3.select(self.frameElement).style("height", "800px");

        this.update = function (source) {
          _this.width = 800;
          // Compute the new tree layout.
          var nodes = _this.tree(_this.root);
          var nodesSort = [];
          nodes.eachBefore(function (n) {
            nodesSort.push(n);
          });
          _this.height = Math.max(500, nodesSort.length * _this.barHeight + _this.margin.top + _this.margin.bottom);
          var links = nodesSort.slice(1);
          // Compute the "layout".
          nodesSort.forEach(function (n, i) {
            n.x = i * _this.barHeight;
          });
          d3.select('svg').transition().
            duration(_this.duration).
            attr("height", _this.height);
          // Update the nodes…
          var node = _this.svg.selectAll('g.node').
            data(nodesSort, function (d) {
              return d.id || (d.id = ++this.i);
            });
          // Enter any new nodes at the parent's previous position.
          var nodeEnter = node.enter().append('g').
            attr('class', 'node').
            attr('transform', function () {
              return 'translate(' + source.y0 + ',' + source.x0 + ')';
            }).
            on('click', toggle2);
          nodeEnter.append('circle').
            attr('r', 1e-6).
            style('fill', function (d) {

              if (d.class === "found") {
                return "#ff4136"; //red
              } else if (d._children) {
                return "lightsteelblue";
              } else {
                return "#fff";
              }
            });
          nodeEnter.append('text').
            attr('x', function (d) {
              return d.children || d._children ? 10 : 10;
            }).
            attr('dy', '.35em').
            attr('text-anchor', function (d) {
              return d.children || d._children ? 'start' : 'start';
            }).
            text(function (d) {
              if (HierType == 'parent_child') {
                if (showLabel == 'on') {
                  var formatComma4 = d3.format(",d");
                  return d.data.id.substring(d.data.id.lastIndexOf(DelimiterChosen) + 1) + " (" + formatComma4(d.data.data.value) + ")"; }
                else
                  return d.data.id.substring(d.data.id.lastIndexOf(DelimiterChosen) + 1)
              }
              else {
                if (showLabel == 'on') {
                  var formatComma = d3.format(",d");
                  return d.data.data.id + " (" + formatComma(d.data.value) + ")";
                }
                else
                  return d.data.data.id;
              }
            }).
            style('fill-opacity', 1e-6);
          nodeEnter.append('svg:title').text(function (d) {
            if (HierType == 'parent_child') {
              if (showLabel == 'on') {
                var formatComma5 = d3.format(",d");
                return d.data.id.substring(d.data.id.lastIndexOf(DelimiterChosen) + 1) + " (" + formatComma5(d.data.data.value) + ")"; }
              else
                return d.data.id.substring(d.data.id.lastIndexOf(DelimiterChosen) + 1);
            }
            else {
              if (showLabel == 'on') {
                var formatComma2 = d3.format(",d");
                return d.data.data.id + " (" + formatComma2(d.data.value) + ")";
              }
              else
                return d.data.data.id
            }
          });

          // Transition nodes to their new position.
          var nodeUpdate = node.merge(nodeEnter).
            transition().
            duration(_this.duration);
          nodeUpdate.
            attr('transform', function (d) {
              return 'translate(' + d.y + ',' + d.x + ')';
            });
          nodeUpdate.select('circle').
            attr('r', 4.5).
            style('fill', function (d) {

              if (d.class === "found") {
                return "#ff4136"; //red
              } else if (d._children) {
                return "lightsteelblue";
              } else {
                return "#fff";
              }
            });
          nodeUpdate.select('text').
            style('fill-opacity', 1);
          // Transition exiting nodes to the parent's new position (and remove the nodes)
          var nodeExit = node.exit().transition().
            duration(_this.duration);
          nodeExit.
            attr('transform', function (d) {
              return 'translate(' + source.y + ',' + source.x + ')';
            }).
            remove();
          nodeExit.select('circle').
            attr('r', 1e-6);
          nodeExit.select('text').
            style('fill-opacity', 1e-6);
          // Update the links…
          var link = _this.svg.selectAll('path.link').
            data(links, function (d) {
              var id = d.id + '->' + d.parent.id;
              return id;
            });
          // Enter any new links at the parent's previous position.
          var linkEnter = link.enter().insert('path', 'g').
            attr('class', 'link').
            attr('d', function (d) {
              var o = { x: source.x0, y: source.y0, parent: { x: source.x0, y: source.y0 } };
              return _this.connector(o);
            });
          // Transition links to their new position.
          link.merge(linkEnter).transition().
            duration(_this.duration).
            attr('d', _this.connector)

            .style("stroke", function (d) {
              if (d.class === "found") {
                return "#ff4136";
              }
            });
          // // Transition exiting nodes to the parent's new position.
          link.exit().transition().
            duration(_this.duration).
            attr('d', function (d) {
              var o = { x: source.x, y: source.y, parent: { x: source.x, y: source.y } };
              return _this.connector(o);
            }).
            remove();
          // Stash the old positions for transition.
          nodesSort.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
          });
        }

        function select2DataCollectName(d) {
          if (d.children)
            d.children.forEach(select2DataCollectName);
          else if (d._children)
            d._children.forEach(select2DataCollectName);
          if (HierType == 'parent_child')
            select2Data.push(d.data.id.substring(d.data.id.lastIndexOf(DelimiterChosen) + 1));
          else
            select2Data.push(d.data.id.trim());
        }

        function searchTree(d) {
          if (d.children)
            d.children.forEach(searchTree);
          else if (d._children)
            d._children.forEach(searchTree);
          var searchFieldValue = eval(searchField);

          searchFieldValue = searchFieldValue.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '_');
          searchText = searchText.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '_');

          if (searchFieldValue && searchFieldValue.match(searchText)) {
            // Walk parent chain
            var parent = d;
            while (parent && typeof (parent) !== "undefined") {
              parent.class = "found";
              parent = parent.parent;
            }
          }
        }

        function clearAll(d) {
          d.class = "";
          if (d.children)
            d.children.forEach(clearAll);
          else if (d._children)
            d._children.forEach(clearAll);
        }

        function collapseAllNotFound(d) {
          if (d.children) {
            if (d.class !== "found") {
              d._children = d.children;
              d._children.forEach(collapseAllNotFound);
              d.children = null;
            } else
              d.children.forEach(collapseAllNotFound);
          }
        }

        function expandAll(d) {
          if (d._children) {
            d.children = d._children;
            d.children.forEach(expandAll);
            d._children = null;
          } else if (d.children)
            d.children.forEach(expandAll);
        }

        function toggle(d, x) {
          if (d.children) {
            d._children = d.children;
            d.children = null;
          } else {
            d.children = d._children;
            d._children = null;
          }
          clearAll(_this.root);
          if (x == 'y') { d.class = 'found'; }
          _this.update(d);
          $("#searchName").select2("val", "");
        }


        function toggle2(d) {
          toggle(d, 'y');
          arrValue = [];
          arrValue1 = [];
          arrValue2 = [];
          arrValue3 = [];
          arrValue4 = [];
          arrValue5 = [];

          if (HierType == 'parent_child') {
            filterviz1(d);
            filterviz2(d);
            worksheet.applyFilterAsync(DimensionChosenColumn, arrValue, tableau.FilterUpdateType.Replace);
          }
          else {
            filterviz1a(d);

            arrValue.sort();
            for (var l11 = 0; l11 < arrValue.length; l11++) {
              if (arrValue[l11][0] == 'level1') {
                arrValue1.push(arrValue[l11][1])
                LevelDeep = 1;
              }
              if (arrValue[l11][0] == 'level2') {
                arrValue2.push(arrValue[l11][1])
                LevelDeep = 2;
              }
              if (arrValue[l11][0] == 'level3') {
                arrValue3.push(arrValue[l11][1])
                LevelDeep = 3;
              }
              if (arrValue[l11][0] == 'level4') {
                arrValue4.push(arrValue[l11][1])
                LevelDeep = 4;
              }
              if (arrValue[l11][0] == 'level5') {
                arrValue5.push(arrValue[l11][1])
                LevelDeep = 5;
              }
            }

            var LevelDeepness = tableau.extensions.settings.get("LevelDeepness");
            if (Level5 != 'NA' && LevelDeepness == 5) { worksheet.clearFilterAsync(Level5); }
            if (Level4 != 'NA' && LevelDeepness >= 4) { worksheet.clearFilterAsync(Level4); }
            if (Level3 != 'NA' && LevelDeepness >= 3) { worksheet.clearFilterAsync(Level3); }
            if (Level2 != 'NA' && LevelDeepness >= 2) { worksheet.clearFilterAsync(Level2); }
            if (Level1 != 'NA' && LevelDeepness >= 1) { worksheet.clearFilterAsync(Level1); }
            if (arrValue5.length > 0) {
              worksheet.applyFilterAsync(Level5, arrValue5, tableau.FilterUpdateType.Replace);
            }
            if (arrValue4.length > 0) {
              worksheet.applyFilterAsync(Level4, arrValue4, tableau.FilterUpdateType.Replace);
            }
            if (arrValue3.length > 0) {
              worksheet.applyFilterAsync(Level3, arrValue3, tableau.FilterUpdateType.Replace);
            }
            if (arrValue2.length > 0) {
              worksheet.applyFilterAsync(Level2, arrValue2, tableau.FilterUpdateType.Replace);
            }
            if (arrValue1.length > 0) {
              worksheet.applyFilterAsync(Level1, arrValue1, tableau.FilterUpdateType.Replace);
            }
            tableau.extensions.settings.set("LevelDeepness", LevelDeep);
          }
        }
        function filterviz1(d) {
          arrValue.push(d.data.id);

          if (d.parent) {
            arrValue.push(d.parent.data.id)
            filterviz1(d.parent);
          }
        }

        function filterviz2(d) {
          arrValue.push(d.data.id);
          if (d._children) {
            d._children.forEach(filterviz2);
          } else if (d.children) {
            d.children.forEach(filterviz2);
          }
        }

        function filterviz1a(d) {
          arrValue.push([d.data.data.filter, d.data.data.id]);

          if (d.parent) {
            arrValue.push([d.parent.data.data.filter, d.parent.data.data.id])
            filterviz1a(d.parent);
          }
        }

        function revertTree() {
          document.getElementById("revert").blur();
          clearAll(_this.root);
          _this.root.children.forEach(collapseAllNotFound);
          toggle2(_this.root);
          _this.click(_this.root);
          _this.update(_this.root);
        }

        $("#searchName").on("select2-selecting", function (e) {
          clearAll(_this.root);
          expandAll(_this.root);
          _this.update(_this.root);

          if (HierType == 'parent_child')
            searchField = "d.data.id";
          else
            searchField = "d.data.data.id";
          searchText = e.object.text;
          searchTree(_this.root);
          _this.root.children.forEach(collapseAllNotFound);
          _this.update(_this.root);
        })

        $('#revert').click(revertTree);
      }

      MyTree.prototype.$onInit = function () {
        var _this = this;
        this.margin = { top: 20, right: 10, bottom: 20, left: 10 };
        this.width = 1400 - this.margin.right - this.margin.left;
        this.height = 800 - this.margin.top - this.margin.bottom;
        this.barHeight = 20;
        this.barWidth = this.width * .8;
        this.i = 0;
        this.duration = 750;
        this.tree = tree().size([this.width, this.height]);
        this.tree = tree().nodeSize([0, 30]);
        this.root = this.tree(hierarchy(flatdata));
        this.root.each(function (d) {
          d.name = d.id; //transferring name to a name variable
          d.id = _this.i; //Assigning numerical Ids
          _this.i++;
        });
        this.root.x0 = this.root.x;
        this.root.y0 = this.root.y;

        var el = document.getElementById('nodeTree');
        if (el != null) { el.remove(); }
        this.svg = select('body').append('svg').
          attr('width', this.width + this.margin.right + this.margin.left).
          attr('height', this.height + this.margin.top + this.margin.bottom).
          attr('id', 'nodeTree').
          append('g').
          attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
        this.collapse(this.root);
        this.click(this.root);
        this.update(this.root);
      };

      return MyTree;
    }();

    var myTree = new MyTree();
    myTree.$onInit();
  }

})();