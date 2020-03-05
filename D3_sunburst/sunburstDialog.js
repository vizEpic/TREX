'use strict';

// "Anonymous function" - Triggered on document ready of modal dialog.  Perform an initialize dialog, and then build the dialog
(function () {
    $(document).ready(function () {
        tableau.extensions.initializeDialogAsync().then(function (openPayload) {
            buildDialog();
        });
    });

    // "buildDialog function" - Build the dropdown options based on what worksheets are available on the dashboard
    function buildDialog() {
        const dashboard = tableau.extensions.dashboardContent.dashboard;

        dashboard.worksheets.forEach(function (worksheet) {
            $("#selectWorksheet").append("<option value='" + worksheet.name + "'>" + worksheet.name + "</option>");
            $("#filtersheet").append("<option value='" + worksheet.name + "'>" + worksheet.name + "</option>");
        });

        var worksheetName = tableau.extensions.settings.get("selectWorksheet");
        if (worksheetName != undefined) {
            $("#selectWorksheet").val(worksheetName);
            columnsUpdate();
        }

        var varDimension1Label = tableau.extensions.settings.get("showDimension1label");
        if (varDimension1Label != undefined) {
            if (varDimension1Label == 'on') {$("#showDimension1label").prop("checked", true)}
            else {$("#showDimension1label").prop("checked", false)}
        }

        var varDimension2Label = tableau.extensions.settings.get("showDimension2label");
        if (varDimension2Label != undefined) {
            if (varDimension2Label == 'on') {$("#showDimension2label").prop("checked", true)}
            else {$("#showDimension2label").prop("checked", false)}
        }

        var varMeasureLabel = tableau.extensions.settings.get("showMeasurelabel");
        if (varMeasureLabel != undefined) {
            if (varMeasureLabel == 'on') {$("#showMeasurelabel").prop("checked", true)}
            else {$("#showMeasurelabel").prop("checked", false)}
        }

        var ChosenColor = tableau.extensions.settings.get("selectChosenColor");
        if (ChosenColor != undefined) { $("#selectColor").val(ChosenColor); }

        var varDollar = tableau.extensions.settings.get("dollarSign_ind");
        if (varDollar != undefined) {
            if (varDollar == 'on') {$("#dollarSign_Yes").prop("checked", true)}
            else {$("#dollarSign_No").prop("checked", true)}
        }

        $('#selectWorksheet').on('change', '', function () {
            columnsUpdate();
        });

        var filterworksheetName = tableau.extensions.settings.get("filterWorksheet");
        if (filterworksheetName != undefined) {
            $("#filtersheet").val(filterworksheetName);
            columnsUpdate2();
        }
        $('#filtersheet').on('change', '', function () {
            columnsUpdate2();
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
            $("#selectDimension1").text("");
            $("#selectDimension2").text("");
            $("#selectMeasure").text("");

            sumdata.columns.forEach(function (current_value) {
                if (current_value.dataType != 'float' && current_value.dataType != 'int') {
                    $("#selectDimension1").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                    $("#selectDimension2").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                }
                if (current_value.dataType == 'float' || current_value.dataType == 'int') {
                    $("#selectMeasure").append("<option value='" + current_value.fieldName + "'>" + current_value.fieldName + "</option>");
                }
            });
            $("#selectDimension1").val(tableau.extensions.settings.get("FieldName_Dimension1ChosenColumn"));
            $("#selectDimension2").val(tableau.extensions.settings.get("FieldName_Dimension2ChosenColumn"));
            $("#selectMeasure").val(tableau.extensions.settings.get("MeasureChosenColumn"));
        });
    }

    // "columnsUpdate function" - Build the dropdown options based on what columns are available on the dashboard
    function columnsUpdate2() {
        var worksheets2 = tableau.extensions.dashboardContent.dashboard.worksheets;
        var worksheetName2 = $("#filtersheet").val();

        var worksheet2 = worksheets2.find(function (sheet2) {
            return sheet2.name === worksheetName2;
        });

        worksheet2.getSummaryDataAsync().then(function (sumdata2) {
            $("#filterDimension1").text("");
            $("#filterDimension2").text("");

            sumdata2.columns.forEach(function (current_value2) {
                if (current_value2.dataType != 'float' && current_value2.dataType != 'int') {
                    $("#filterDimension1").append("<option value='" + current_value2.fieldName + "'>" + current_value2.fieldName + "</option>");
                    $("#filterDimension2").append("<option value='" + current_value2.fieldName + "'>" + current_value2.fieldName + "</option>");
                }
            });
            $("#filterDimension1").val(tableau.extensions.settings.get("filterDimension1ChosenColumn"));
            $("#filterDimension2").val(tableau.extensions.settings.get("filterDimension2ChosenColumn"));
        });
    }

    //Close the dialog
    function closeDialog() {
        tableau.extensions.ui.closeDialog("10");
    }

    //Save the settings and close the dialog
    function saveButton() {

        if ($("#selectWorksheet").val() == null || $("#selectDimension1").val() == null || $("#selectDimension2").val() == null || $("#selectMeasure").val() == null) {
            alert('Invalid configuration \n\nChoose a valid worksheet, dimension and measure.');
            return;
        }

        if ($("#filtersheet").val() != null && ($("#filterDimension1").val() == null || $("#filterDimension2").val() == null)) {
            alert('Invalid configuration \n\nWhen choosing a target sheet to filter, then choose the filters too.');
            return;
        }

        tableau.extensions.settings.set("selectWorksheet", $("#selectWorksheet").val());
        tableau.extensions.settings.set("FieldName_Dimension1ChosenColumn", $("#selectDimension1").val());
        tableau.extensions.settings.set("FieldName_Dimension2ChosenColumn", $("#selectDimension2").val());
        tableau.extensions.settings.set("MeasureChosenColumn", $("#selectMeasure").val());

        if (($("#filtersheet").val() != null))
        { tableau.extensions.settings.set("filterWorksheet", $("#filtersheet").val());
          tableau.extensions.settings.set("filterDimension1ChosenColumn", $("#filterDimension1").val());
          tableau.extensions.settings.set("filterDimension2ChosenColumn", $("#filterDimension2").val());
    }

        var labelcheckbox1;
        if ($('#showDimension1label').is(":checked")) { labelcheckbox1 = 'on'; }
        else { labelcheckbox1 = 'off'; }
        tableau.extensions.settings.set("showDimension1label", labelcheckbox1);

        var labelcheckbox2;
        if ($('#showDimension2label').is(":checked")) { labelcheckbox2 = 'on'; }
        else { labelcheckbox2 = 'off'; }
        tableau.extensions.settings.set("showDimension2label", labelcheckbox2);

        var labelcheckbox3;
        if ($('#showMeasurelabel').is(":checked")) { labelcheckbox3 = 'on'; }
        else { labelcheckbox3 = 'off'; }
        tableau.extensions.settings.set("showMeasurelabel", labelcheckbox3);

        tableau.extensions.settings.set("selectChosenColor", $("#selectColor").val());

        var DollarSign;
        if ($('#dollarSign_Yes').is(":checked")) {DollarSign = 'on';}
        else {DollarSign = 'off';}
        tableau.extensions.settings.set("dollarSign_ind", DollarSign);

        tableau.extensions.settings.saveAsync().then((currentSettings) => {
            tableau.extensions.ui.closeDialog("10");
        });
    }
})();