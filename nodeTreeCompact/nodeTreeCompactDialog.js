'use strict';

// "Anonymous function" - Triggered on document ready of modal dialog.  Perform an initialize dialog, and then build the dialog
(function () {
    $(document).ready(function () {
        tableau.extensions.initializeDialogAsync().then(function (openPayload) {
            buildDialog();
        });

        // Call the configure function on a trigger of configure button onClick
        $(function () {
            $('#HierarchyType').change(function () {
                updateHierType();
            });
        });
    });

    function updateHierType() {
        let HierType = $("#HierarchyType").val();

        if (HierType == 'parent_child') {
            document.getElementById("parentchild").style.display = "inline";
            document.getElementById("flat").style.display = "none";
        }
        else {
            document.getElementById("parentchild").style.display = "none";
            document.getElementById("flat").style.display = "inline";
        }
    }

    // "buildDialog function" - Build the dropdown options based on what worksheets are available on the dashboard
    function buildDialog() {
        const dashboard = tableau.extensions.dashboardContent.dashboard;

        dashboard.worksheets.forEach(function (worksheet) {
            $("#selectWorksheet").append("<option value='" + worksheet.name + "'>" + worksheet.name + "</option>");
        });

        var HierType = tableau.extensions.settings.get("HierarchyType");
        if (HierType != undefined) {
            $("#HierarchyType").val(HierType);
            updateHierType();
        }

        var worksheetName = tableau.extensions.settings.get("selectWorksheet");
        if (worksheetName != undefined) {
            $("#selectWorksheet").val(worksheetName);
            columnsUpdate();
        }

        var varDelimiter = tableau.extensions.settings.get("DelimiterChosen");
        if (varDelimiter != undefined) {
            $("#selectDelimiter").val(varDelimiter);
        }

        var varMeasureLabel = tableau.extensions.settings.get("ShowMeasureLabel");
        console.log(varMeasureLabel);
        if (varMeasureLabel != undefined) {
            if (varMeasureLabel == 'on') {$("#showmeasurelabel"). prop("checked", true)}
            else {$("#showmeasurelabel"). prop("checked", false)}
        }

        $('#selectWorksheet').on('change', '', function () {
            columnsUpdate();
        });
        $('#cancel').click(closeDialog);
        $('#save').click(saveButton);

    }


    // "columnsUpdate function" - Build the dropdown options based on what columns are available on the dashboard
    function columnsUpdate() {
        var worksheets = tableau.extensions.dashboardContent.dashboard.worksheets;
        var worksheetName = $("#selectWorksheet").val();
        var worksheet = worksheets.find(function (sheet) {
            return sheet.name === worksheetName;
        });

        worksheet.getSummaryDataAsync().then(function (sumdata) {
            $("#selectDimension").append("<option value='NA'>N/A</option>");
            $("#Level1").append("<option value='NA'>N/A</option>");
            $("#Level2").append("<option value='NA'>N/A</option>");
            $("#Level3").append("<option value='NA'>N/A</option>");
            $("#Level4").append("<option value='NA'>N/A</option>");
            $("#Level5").append("<option value='NA'>N/A</option>");
            sumdata.columns.forEach(function (current_value) {
                if (current_value.dataType != 'float' && current_value.dataType != 'int') {
                    $("#selectDimension").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                    $("#Level1").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                    $("#Level2").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                    $("#Level3").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                    $("#Level4").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                    $("#Level5").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                }
                if (current_value.dataType == 'float' || current_value.dataType == 'int') {
                    $("#selectMeasure").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                }
            });
            $("#selectDimension").prop("selectedIndex", 0).val();
            $("#Level1").prop("selectedIndex", 0).val();
            $("#Level2").prop("selectedIndex", 0).val();
            $("#Level3").prop("selectedIndex", 0).val();
            $("#Level4").prop("selectedIndex", 0).val();
            $("#Level5").prop("selectedIndex", 0).val();
            $("#selectMeasure").val(tableau.extensions.settings.get("MeasureChosenColumn"));
            let j0 = tableau.extensions.settings.get("DimensionChosenColumn");
            if (j0 != undefined) { $("#selectDimension").val(j0) };
            let j1 = tableau.extensions.settings.get("Level1");
            if (j1 !== undefined) { $("#Level1").val(j1) };
            let j2 = tableau.extensions.settings.get("Level2");
            if (j2 !== undefined) { $("#Level2").val(j2) };
            let j3 = tableau.extensions.settings.get("Level3");
            if (j3 !== undefined) { $("#Level3").val(j3) };
            let j4 = tableau.extensions.settings.get("Level4");
            if (j4 !== undefined) { $("#Level4").val(j4) };
            let j5 = tableau.extensions.settings.get("Level5");
            if (j5 !== undefined) { $("#Level5").val(j5) };
        });
    }

    //Close the dialog
    function closeDialog() {
        tableau.extensions.ui.closeDialog("10");
    }

    //Save the settings and close the dialog
    function saveButton() {

        let HierType = $("#HierarchyType").val();
        if (HierType == 'parent_child') {
            if ($("#selectWorksheet").val() == null || $("#selectDimension").val() == null || $("#selectDelimiter").val == null || $("#selectMeasure").val() == null) {
                alert('Invalid configuration \n\nChoose a valid worksheet, dimension, delimiter, and measure.');
                return;
            }
        }
        else {
            if ($("#selectWorksheet").val() == null || $("#Level1").val() == null || $("#Level2").val() == null || $("#Level3").val() == null || $("#Level4").val() == null || $("#Level5").val() == null || $("#selectMeasure").val() == null) {
                alert('Invalid configuration \n\nChoose a valid worksheet, level and measure.');
                return;
            }
            else {
                if ($("#Level1").val() == 'NA' && $("#Level2").val() == 'NA' && $("#Level3").val() == 'NA' && $("#Level4").val() == 'NA' && $("#Level5").val() == 'NA') {
                    alert('Invalid configuration \n\nChoose at least one level.');
                    return;
                }
                else {
                    var l1 = $("#Level1").val();
                    var l2 = $("#Level2").val();
                    var l3 = $("#Level3").val();
                    var l4 = $("#Level4").val();
                    var l5 = $("#Level5").val();
                    if ((l1 == 'NA' && (l2 != 'NA' || l3 != 'NA' || l4 != 'NA' || l5 != 'NA')) || (l2 == 'NA' && (l3 != 'NA' || l4 != 'NA' || l5 != 'NA')) || (l3 == 'NA' && (l4 != 'NA' || l5 != 'NA')) || (l4 == 'NA' && (l5 != 'NA'))) {
                        alert('Invalid configuration \n\nLevels must be consecutive.');
                        return;
                    }
                    if (l1 == 'NA' || l2 == 'NA' || l3 == 'NA') {
                        alert('Invalid configuration \n\nAt least 3 levels are required.');
                        return;
                    }
                    if (l1 == l2 || l1 == l3 || l2 == l3) {
                        alert('Invalid configuration \n\nDuplicate levels are not allowed.');
                        return;
                    }
                    if (l4 != 'NA' && (l1 == l4 || l2 == l4 || l3 == l4)) {
                        alert('Invalid configuration \n\nDuplicate levels are not allowed.');
                        return;
                    }
                    if (l5 != 'NA' && (l1 == l5 || l2 == l5 || l3 == l5 || l4 == l5)) {
                        alert('Invalid configuration \n\nDuplicate levels are not allowed.');
                        return;
                    }
                }
            }
        }

        var labelcheckbox;
        if ($('#showmeasurelabel').is(":checked")) { labelcheckbox = 'on'; }
        else { labelcheckbox = 'off'; }

         tableau.extensions.settings.set("selectWorksheet", $("#selectWorksheet").val());
        tableau.extensions.settings.set("DimensionChosenColumn", $("#selectDimension").val());
        tableau.extensions.settings.set("DelimiterChosen", $("#selectDelimiter").val());
        tableau.extensions.settings.set("MeasureChosenColumn", $("#selectMeasure").val());
        tableau.extensions.settings.set("ShowMeasureLabel", labelcheckbox);
        tableau.extensions.settings.set("HierarchyType", $("#HierarchyType").val());
        tableau.extensions.settings.set("Level1", $("#Level1").val());
        tableau.extensions.settings.set("Level2", $("#Level2").val());
        tableau.extensions.settings.set("Level3", $("#Level3").val());
        tableau.extensions.settings.set("Level4", $("#Level4").val());
        tableau.extensions.settings.set("Level5", $("#Level5").val());

        tableau.extensions.settings.saveAsync().then((currentSettings) => {
        tableau.extensions.ui.closeDialog("10");
        });
    }
})();