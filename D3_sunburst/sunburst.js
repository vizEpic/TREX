'use strict';

// "Anonymous function" - Triggered on document ready of modal dialog.  Perform an initialize dialog, and then build the dialog
(function () {
    let unregisterHandlerFunctions = [];
    var dict_Settings = [];

    $(document).ready(function () {
        // Initialize the extension and pass in a special keyword of "configure" which is needed in order to link the main page and config page together
        tableau.extensions.initializeAsync({ 'configure': configure }).then(function () {
            getData_to_D3();
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
            var popupUrl = location + '/D3_sunburst_dialog.html';
        else
            var popupUrl = `${window.location.origin}/D3_sunburst/D3_sunburst_dialog.html`;
        var defaultPayload = "";

        tableau.extensions.ui.displayDialogAsync(popupUrl, defaultPayload, { height: 810, width: 750 }).then((closePayload) => {
            getData_to_D3();
        });
    }

    // This is a handling function that is called anytime a filter is changed in Tableau.
    function filterChangedHandler(filterEvent) {
        unregisterHandlerFunctions.forEach(function (unregisterHandlerFunction) {
            unregisterHandlerFunction();
        });
        getData_to_D3();
    }

    // "getData_to_D3" - On document ready and anytime that the dialog is closed, check for settings and draw the chart
    function getData_to_D3() {
        // Get the worksheets within the dashboard
        const worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;

        // Get all saved settings
        dict_Settings = tableau.extensions.settings.getAll();

        // Get the chosen ordered dimensions in order to do a map reduce
        var Ordered_Dimensions = [];
        for (var key in dict_Settings) {
            var value = dict_Settings[key];

            if (key.startsWith('FieldName_')) {
                Ordered_Dimensions.push(value);
            }
        }

        var worksheetName = dict_Settings['selectWorksheet'];
        if (worksheetName > ' ') {
            $('#wrapper').hide();
            $('#D3_Chart').show();

            var worksheet = worksheets.find(function (sheet) {
                return sheet.name === worksheetName;
            });

            let unregisterHandlerFunction = worksheet.addEventListener(tableau.TableauEventType.FilterChanged, filterChangedHandler);
            unregisterHandlerFunctions.push(unregisterHandlerFunction);

            var strMeasureName = dict_Settings['MeasureChosenColumn'];
            var regExp = /\(([^)]+)\)/;
            var regExpMatches = regExp.exec(strMeasureName);
            var strDisplayName = regExpMatches[1];

            worksheet.getSummaryDataAsync().then(function (sumdata) {
                if (sumdata.data.length > 0) {
                    // Convert Tableau data into JSON array for D3 processing.
                    var Tableau_Array_of_Objects = ReduceToObjectTablulated(sumdata);
                    // Count the # of unique elements amongst the two dimensions
                    var uniqEleCount = uniqueElementCnt(Tableau_Array_of_Objects, Ordered_Dimensions);
                    // Convert JSON data to a parent child hierarchy
                    var TableauTreeData = Convert_To_TreeData(Tableau_Array_of_Objects, Ordered_Dimensions, strMeasureName, strDisplayName);
                    draw_D3(TableauTreeData, Ordered_Dimensions, uniqEleCount);
                }
                else {
                    d3.select("svg").remove();
                }
            });
        }
    }

    // Convert result of getSummaryDataAsync() to a JSON array
    function ReduceToObjectTablulated(TableauData) {
        var Array_Of_Objects = [];

        for (var RowIndex = 0; RowIndex < TableauData.data.length; RowIndex++) {
            var SingleObject = new Object();
            for (var FieldIndex = 0; FieldIndex < TableauData.data[RowIndex].length; FieldIndex++) {
                var FieldName = TableauData.columns[FieldIndex].fieldName;
                SingleObject[FieldName] = TableauData.data[RowIndex][FieldIndex].value;
            }
            Array_Of_Objects.push(SingleObject);
        }

        if (Object.keys(Array_Of_Objects[0]).length == 2) {
            for (var index = 0; index < Array_Of_Objects.length; index++) {
                Array_Of_Objects[index].placeholder = ' ';
            }
        }
        return Array_Of_Objects;
    }

    // Count the number of unique dimension elements
    function uniqueElementCnt(inputArr, dimensionList) {
        var uniqueList = [];
        for (var RowIndex = 0; RowIndex < inputArr.length; RowIndex++) {
            for (var ColIndex = 0; ColIndex < dimensionList.length; ColIndex++) {
                uniqueList.push(inputArr[RowIndex][dimensionList[ColIndex]]);
            }
        }
        uniqueList = uniqueList.filter(distinct);
        return uniqueList.length;
    }

    const distinct = (value, index, self) => {
        return self.indexOf(value) === index;
    }

    // Convert tabulated data into a parent / child hierarchy
    function Convert_To_TreeData(FlatData, arrayDimensionNames, strValueName, strDisplayValue) {
        var localArrayDimensionNames = arrayDimensionNames.slice();
        var TreeData = { name: strDisplayValue, children: [] };
        var final_Child_Level = localArrayDimensionNames.pop();
        var non_Final_Children_Levels = localArrayDimensionNames;
        FlatData.forEach(function (d) {
            var depthCursor = TreeData.children;
            non_Final_Children_Levels.forEach(function (property, depth) {
                var index;
                depthCursor.forEach(function (child, i) {
                    if (d[property] == child.name) index = i;
                });
                if (isNaN(index)) {
                    depthCursor.push({ name: d[property], children: [] });
                    index = depthCursor.length - 1;
                }
                depthCursor = depthCursor[index].children;
                if (typeof d[strValueName] != 'number') {
                    var TempString = d[strValueName].replace(/,/g, "");
                    var Target_Key = Math.round(+TempString);
                } else {
                    var Target_Key = Math.round(d[strValueName]);
                }

                if (depth === non_Final_Children_Levels.length - 1) {
                    depthCursor.push({ name: d[final_Child_Level], size: Target_Key });
                }
            });
        });
        return TreeData;
    }

    // Main proc for drawing the sunburst
    function draw_D3(nodeData, DimensionList, uniqueElementCount) {
        d3.select("svg").remove();

        const width = window.innerWidth,
            height = window.innerHeight,
            radius = (Math.min(width, height) / 2) - 5;

        const formatNumber = d3.format(',d');

        const x = d3.scaleLinear()
            .range([0, 2 * Math.PI]);

        const y = d3.scaleSqrt()
            .range([radius * .1, radius]);

        const colorChromaticScale = dict_Settings['selectChosenColor'];
        const arrStepColors = steppedColorArray(colorChromaticScale, uniqueElementCount);
        const color = d3.scaleOrdinal(arrStepColors);

        const partition = d3.partition();

        const arc = d3.arc()
            .startAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
            .endAngle(function (d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
            .innerRadius(function (d) { return Math.max(0, y(d.y0)); })
            .outerRadius(function (d) { return Math.max(0, y(d.y1)); });

        const middleArcLine = d => {
            const halfPi = Math.PI / 2;
            const angles = [x(d.x0) - halfPi, x(d.x1) - halfPi];
            const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);

            const middleAngle = (angles[1] + angles[0]) / 2;
            const invertDirection = middleAngle > 0 && middleAngle < Math.PI; // On lower quadrants write text ccw
            if (invertDirection) { angles.reverse(); }

            const path = d3.path();
            path.arc(0, 0, r, angles[0], angles[1], invertDirection);
            return path.toString();
        };

        const gatherText = d => {
            var finText = "";
            var Dim1label = dict_Settings['showDimension1label'];
            var Dim2label = dict_Settings['showDimension2label'];
            var Msrlabel = dict_Settings['showMeasurelabel'];
            switch (d.depth) {
                case 0:
                    if (Msrlabel == 'on') finText = 'Total ' + d.data.name + ' ' + DollarSign + formatNumber(d.value)
                    else if (Msrlabel == 'on' || Dim1label == 'on'  || Dim2label == 'on') finText = 'Total ' + d.data.name;
                    break;
                case 1:
                    if (Msrlabel == 'on' && Dim1label == 'on') finText = d.data.name + ' ' + DollarSign + formatNumber(d.value)
                    else if (Dim1label == 'on') finText = d.data.name
                    else if (Msrlabel == 'on') finText = DollarSign + formatNumber(d.value);
                    break;
                case 2:
                    if (Msrlabel == 'on' && Dim2label == 'on') finText = d.data.name + ' ' + DollarSign + formatNumber(d.value)
                    else if (Dim2label == 'on') finText = d.data.name
                    else if (Msrlabel == 'on') finText = DollarSign + formatNumber(d.value);
            }
            return finText;
        }

        const textFits = d => {
            const CHAR_SPACE = 6;

            var lengthFull = gatherText(d);

            const deltaAngle = x(d.x1) - x(d.x0);
            const r = Math.max(0, (y(d.y0) + y(d.y1)) / 2);
            const perimeter = r * deltaAngle;

            return lengthFull.length * CHAR_SPACE < perimeter;
        };

        var svg = d3.select('body').append('svg')
            .style("width", width)
            .style("height", height)
            .attr('viewBox', `${-width / 2} ${-height / 2 } ${width} ${height}`)
            .on('click', () => focusOn());

        var root = d3.hierarchy(nodeData);
        root.sum(d => d.size);

        const slice = svg.selectAll('g.slice')
            .data(partition(root).descendants());

        slice.exit().remove();

        const newSlice = slice.enter()
            .append('g').attr('class', 'slice')
            .on('click', d => {
                d3.event.stopPropagation();
                focusOn(d);
            });

        var DollarSign = "";
        if (dict_Settings['dollarSign_ind'] == "on") {
            DollarSign = "$";
        }

        // Tooltip
        newSlice.append('title')
            .text(d => d.data.name + '\n' + DollarSign + formatNumber(d.value));

        newSlice.append('path')
            .attr('class', 'main-arc')
            .style('fill', function (d) { return color(d.data.name); })
            .attr('d', arc);

        newSlice.append('path')
            .attr('class', 'hidden-arc')
            .attr('id', (_, i) => `hiddenArc${i}`)
            .attr('d', middleArcLine);

        const text = newSlice.append('text')
            .attr('display', d => textFits(d) ? null : 'none');

        // Label
        text.append('textPath')
            .attr('startOffset', '50%')
            .attr('xlink:href', (_, i) => `#hiddenArc${i}`)
            .text(d => gatherText(d));

        var filterSheet = dict_Settings['filterWorksheet'];
        var Filter_Dimensions = [];
        if (filterSheet != undefined) {
            for (var key in dict_Settings) {
                var value = dict_Settings[key];
                if (key.startsWith('filterDimension')) {
                    Filter_Dimensions.push(value);
                }
            }
        }

        // Established stepped color scale to help the color contrast of the D3 chart
        function steppedColorArray(ColorScaleType, uniqueElementCount) {
            var steppedColorScale = [];
            var subColor = 'd3.' + ColorScaleType;
            var actColor = eval(subColor);

            for (var RowIndex = 0; RowIndex < uniqueElementCount; RowIndex++) {
                steppedColorScale.push(actColor(RowIndex / uniqueElementCount));
            }
            return steppedColorScale;
        }

        // On click, zoom on the proper level
        function focusOn(d = { x0: 0, x1: 1, y0: 0, y1: 1 }) {
            const transition = svg.transition()
                .duration(750)
                .tween('scale', () => {
                    const xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                        yd = d3.interpolate(y.domain(), [d.y0, 1]);
                    return t => { x.domain(xd(t)); y.domain(yd(t)); };
                });

            transition.selectAll('path.main-arc')
                .attrTween('d', d => () => arc(d));

            transition.selectAll('path.hidden-arc')
                .attrTween('d', d => () => middleArcLine(d));

            transition.selectAll('text')
                .attrTween('display', d => () => textFits(d) ? null : 'none');

            moveStackToFront(d);

            // Sub-function of focusOn
            function moveStackToFront(elD) {
                svg.selectAll('.slice').filter(d => d === elD)
                    .each(function (d) {
                        this.parentNode.appendChild(this);
                        if (d.parent) { moveStackToFront(d.parent); }
                    })
            }

            var clickDepth = d.depth;
            var arrValue = [];
            arrValue.push(d.data.name);

            if (clickDepth == 0) {
                if (filterSheet != '') {
                    resetFilter(filterSheet, DimensionList.slice(clickDepth), Filter_Dimensions);
                }
            } else {
                if (filterSheet != '') {
                    resetFilter(filterSheet, DimensionList.slice(clickDepth), Filter_Dimensions);
                    if (Filter_Dimensions.includes(DimensionList[clickDepth - 1])) {
                        setFilterTo(filterSheet, DimensionList[clickDepth - 1], arrValue);
                    }
                }
            }
        }

        // Filter at level 0 and reset the target worksheet filter
        function resetFilter(filterSheetName, arrDimensionList, arrTargetFilters) {
            var sheetToFilter = tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
                return sheet.name === filterSheetName;
            });

            arrDimensionList.forEach(function (currentValue) {
                if (arrTargetFilters.includes(currentValue)) {
                    sheetToFilter.clearFilterAsync(currentValue);
                }
            });
        }

        // Filter at the chosen dimension and apply the filter to the target worksheet
        function setFilterTo(filterSheetName, filterName, values) {
            var sheetToFilter = tableau.extensions.dashboardContent.dashboard.worksheets.find(function (sheet) {
                return sheet.name === filterSheetName;
            });
            sheetToFilter.applyFilterAsync(filterName, values, tableau.FilterUpdateType.Replace);
        }


    }
})();