var data = JSON.parse(localStorage["data"] || null) || [];
var huurders = JSON.parse(localStorage["huurders"] || null) || [];
//huurders = [{ "name": "test", "account": "rekenin", "rent": "rent" }, { "name": "Dinto", "account": "558717845", "rent": 9547.09 }, { "name": "BELASTINGDIENST", "account": "2445588,186728476", "rent": 235 }];

var ngRentCtrl;

$(function () { // Init.
    fileReader();
    //showHuurders();
    ngRentCtrl = angular.element(document.body).scope();
});

function parseCSV(text, type) {
    data = []; //hmmm

    switch (type) {
        case "Girotel":
            parseGirotel(text);
            break;
        case "ABN":
            parseABN(text);
            break;
        case "SNS":
            parseSNS(text);
            break;
        case "Huurders":
            parseHuurders(text);
            return; // Returns
        default: throw new Error("Parser for '" + datatype + "' not implemented.");
    }

    // Store.
    localStorage["data"] = JSON.stringify(data);
    // Angular show.
    ngRentCtrl.setData(data);
}

function parseGirotel(text) { // ING bank.
    var csvArray = CSVToArray(text);
    for (var r = 0; r < csvArray.length; r++) {
        var items = csvArray[r];
        var transaction = {};
        transaction.account = items[4];
        if (!transaction.account || transaction.account == "0") continue; // Skip blanks.
        transaction.name = items[5].replace(/["']/g, "").trim(); // Trim quotes and whitespace.
        transaction.date = parseDate(items[1]); //jjjjmmdd
        transaction.amount = items[8] == "B" ? items[7] : "-" + items[7]; // "Bij" of "Af"
        transaction.amount = parseFloat(transaction.amount);
        transaction.desc = items[10].replace(/["']/g, "").trim();
        // Bind account to tenant.
        linkTenant(transaction);

        data.push(transaction);
    }
}

function parseSNS(text) { // SNS bank.
    var csvArray = CSVToArray(text, ";");
    for (var r = 0; r < csvArray.length; r++) {
        var items = csvArray[r];
        var transaction = {};
        transaction.account = items[2];
        if (!transaction.account) continue; // Skip blanks.
        transaction.name = items[3].replace(/["']/g, "").trim(); // Trim qoutes and whitespace.
        transaction.date = parseDateDagMaandJaar(items[0]);
        transaction.amount = items[10];
        transaction.amount = parseFloat(transaction.amount);
        transaction.desc = items[17].replace(/["']/g, "").trim();
        // Bind account to tenant.
        linkTenant(transaction);

        data.push(transaction);
    }
}

function parseABN(text) { // ABN bank. You are basterds.
    var csvArray = CSVToArray(text, "\t");
    var reAcc = /IBAN:\s*(\S+)/;
    var reAcc2 = /IBAN\/([^\/]+)\//;
    var reName = /Naam:\s*(.+)\s\s/;
    var reName2 = /NAME\/([^\/]+)\//;
    for (var r = 0; r < csvArray.length; r++) {
        var items = csvArray[r];
        var transaction = {};
        transaction.account = reAcc.exec(items[7]) && reAcc.exec(items[7])[1]; // Test & Extract part after 'IBAN: '.
        // Try one more because they are basterds.
        if (!transaction.account)
            transaction.account = reAcc2.exec(items[7]) && reAcc2.exec(items[7])[1]; // Test & Extract 'IBAN/.../'.
        if (!transaction.account) continue; // Skip blanks
        transaction.name = reName.exec(items[7]) && reName.exec(items[7])[1]; // Test & Extract part after 'Name: '.
        // Did I mention they are basterds?
        if (!transaction.name)
            transaction.name = (reName2.exec(items[7]) && reName2.exec(items[7])[1]) || "N/A";  // Test & Extract 'NAME/.../'.
        transaction.date = parseDate(items[2]); //jjjjmmdd
        transaction.amount = items[6].replace(',', '.');
        transaction.amount = parseFloat(transaction.amount);
        transaction.desc = items[7].replace(/  +/g, ' ').trim();
        // Bind account to tenant.
        linkTenant(transaction);

        data.push(transaction);
    }
}

function linkTenant(transaction) {
    for (var j = 0; j < huurders.length; j++) {
        if (huurders[j].account.indexOf(transaction.account) > -1) {
            transaction.tenant = huurders[j].name;
            transaction.rent = parseFloat(huurders[j].rent);
            transaction.diff = huurders[j].rent - transaction.amount; //TODO monthly!!!
            return;
        }
    }
}

function parseHuurders(text) { // CSV ; separated list.
    huurders = [];

    var rows = text.split('\n');
    for (var r = 0; r < rows.length; r++) {
        var items = rows[r].split(';');
        if (items[3] == undefined || items[3] == "" || !items[3].match(/\d/)) continue; // Skip blank or text only (titles/comments) Accountnumbers.
        var huurder = {};
        huurder.address = items[0];
        huurder.name = items[1];
        huurder.tel = items[2];
        huurder.account = items[3];
        huurder.rent = items[4].replace(',', '.');
        huurder.mail = items[6];

        huurders.push(huurder);
    }

    // Store.
    localStorage["huurders"] = JSON.stringify(huurders);
    // Angular show.
    ngRentCtrl.setData(huurders, "tenants");
}

function toTable() {
    refined = data.filter(function (row) {
        return parseInt(row.account) > 0 &&
               //row.name >= 500 &&
               //row.date >= 2 &&
               parseFloat(row.amount) > 0;
    });

    // Bottom.
    var output = "<table><thead><tr><th>Account</th><th>Name</th><th>Date</th><th>Amount</th><th>Desc</th></tr></thead><tbody>";
    for (var i = 0; i < refined.length; i++) {
        output += "<tr><td>" + refined[i].account + "</td><td>" + refined[i].name + "</td><td>" + refined[i].date.toLocaleDateString() + "</td><td>&euro; " + refined[i].amount + "</td><td>" + refined[i].desc + "</td></tr>";
    }
    output += "</tbody></table>";
    $('#output').html(output);

    // Top.
    var table = "<table><thead><tr><th>Account</th><th>Name</th><th>Date</th><th>Amount</th><th>Rent</th><th>Diff</th></tr></thead><tbody>";
    for (var i = 0; i < refined.length; i++) {
        for (var j = 0; j < huurders.length; j++) {
            if (huurders[j].account.indexOf(refined[i].account) == -1)
                continue;
            else {
                var diff = (huurders[j].rent - refined[i].amount).toFixed(2); //TODO monthly!!!
                var style = " style='background-color: ";
                if (diff > 0)
                    style += "red;'";
                else
                    style += "green;'";

                table += "<tr><td>" + refined[i].account
                  + "</td><td>" + huurders[j].name
                  + "</td><td>" + (refined[i].date.getMonth() + 1) + "-" + refined[i].date.getFullYear()
                  + "</td><td>&euro; " + refined[i].amount
                  + "</td><td>&euro; " + huurders[j].rent
                  + "</td><td" + style
                  + ">" + diff
                  + "</td></tr>";
            }
        }
    }
    table += "</tbody></table>";

    $('#top').html(table);
} //Obsolete

function parseDate(str) { //jjjjmmdd
    var arr = [];
    str = str.replace(/[^\d.]/g, ""); //strip non digits
    arr.push(str.substring(0, 4));
    arr.push(str.substring(4, 6));
    arr.push(str.substring(6, 8));

    var date = new Date(arr[0], arr[1] - 1, arr[2]);
    return date;
}

function parseDateDagMaandJaar(strDate) { // dd-mm-jjjj
    var dateParts = strDate.split("-");
    return new Date(dateParts[2], (dateParts[1] - 1), dateParts[0]);
}

function showHuurders() {
    // Replaced by angular
    //var output = "<table><thead><tr><th>Huur</th><th>Name</th></tr></thead><tbody>";
    //for (var i = 0; i < huurders.length; i++) {
    //    output += "<tr onclick='showInfo(" + i + ");'><td>&euro; " + huurders[i].rent + "</td><td>" + huurders[i].name + "</td></tr>";
    //}
    //output += "</tbody></table>";

    //$('#huurderslijst').html(output);
}

function fileReader() {
    if (!window.FileReader) {
        $('p.help').text("This browser doesn't support the File API");
        return;
    }

    // Input handler
    $("input:file").on("change", function () {
        readFileAsText(this.files[0]);
    });

    // Drag and drop methods
    $("input:file").on("dragover", function (e) {
        e.preventDefault();
        return false;
    });

    $("input:file").on("drop", function (e) {
        e.stopPropagation();
        readFileAsText(e.dataTransfer.files[0]);
        return false;
    });
}

var fileRef;
function readFileAsText(file) {
    // TODO: Replace with modal
    //var datatype = "Girotel";
    fileRef = file;
    //continueReadFileAsText(file, datatype);
    $('#modal-container-fileType').modal('show');
}

function continueReadFileAsText(file, datatype) {
    var reader = new FileReader();
    reader.readAsText(file);

    reader.onload = function (event) {
        parseCSV(event.target.result, datatype);
    };

    reader.onerror = function () {
        alert('Unable to read ' + file.fileName);
    };
}

function showInfo(i) {
    alert(huurders[i].name);
}

function exportToCsv(csv) { // Not used.
    //var myCsv = "Col1,Col2,Col3\nval1,val2,val3\nval1,val2,val3";
    window.open('data:text/csv;charset=utf-8,' + escape(csv));
}


// This will parse a delimited string into an array of
// arrays. The default delimiter is the comma, but this
// can be overriden in the second argument.
function CSVToArray(strData, strDelimiter) {
    // Check to see if the delimiter is defined. If not,
    // then default to comma.
    strDelimiter = (strDelimiter || ",");

    // Create a regular expression to parse the CSV values.
    var objPattern = new RegExp(
        (
            // Delimiters.
            "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
            // Quoted fields.
            "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
            // Standard fields.
            "([^\"\\" + strDelimiter + "\\r\\n]*))"
        ), "gi");

    // Create an array to hold our data. Give the array
    // a default empty first row.
    var arrData = [[]];

    // Create an array to hold our individual pattern
    // matching groups.
    var arrMatches = null;

    // Keep looping over the regular expression matches
    // until we can no longer find a match.
    while (arrMatches = objPattern.exec(strData)) {

        // Get the delimiter that was found.
        var strMatchedDelimiter = arrMatches[1];

        // Check to see if the given delimiter has a length
        // (is not the start of string) and if it matches
        // field delimiter. If id does not, then we know
        // that this delimiter is a row delimiter.
        if (strMatchedDelimiter.length && (strMatchedDelimiter != strDelimiter)) {
            // Since we have reached a new row of data,
            // add an empty row to our data array.
            arrData.push([]);

        }
        // Now that we have our delimiter out of the way,
        // let's check to see which kind of value we
        // captured (quoted or unquoted).
        if (arrMatches[2]) {
            // We found a quoted value. When we capture
            // this value, unescape any double quotes.
            var strMatchedValue = arrMatches[2].replace(
                new RegExp("\"\"", "g"),
                "\""
                );

        } else {
            // We found a non-quoted value.
            var strMatchedValue = arrMatches[3];
        }
        // Now that we have our value string, let's add
        // it to the data array.
        arrData[arrData.length - 1].push(strMatchedValue);
    }

    // Return the parsed data.
    return (arrData);
}