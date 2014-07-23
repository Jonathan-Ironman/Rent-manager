var data = [];
var refined = [];
var huurders = JSON.parse(localStorage["huurders"] || null) || [];
//huurders = [{ "name": "test", "reks": "rekenin", "rent": "rent" }, { "name": "Dinto", "reks": "558717845", "rent": 9547.09 }, { "name": "BELASTINGDIENST", "reks": "2445588,186728476", "rent": 235 }];

var filter = {}; //TODO
filter.rek = 0;
filter.name = 0;
filter.date = 0;
filter.amount = 0;

$(function () { // Init.
  fileReader();
  showHuurders();
});

function parseGirotel(text) {
  data = [];
  var rows = text.split('\n');

  for (var r = 0; r < rows.length; r++) {
    var items = rows[r].split(',');
    var obj = {};
    obj.rek = items[4];
    if (!obj.rek) continue; // Skip blanks
    obj.name = items[5].replace(/["']/g, "").trim(); //trim qoutes and whitespace
    obj.date = parseDate(items[1]);
    obj.amount = items[8] == '"B"' ? items[7] : "-" + items[7]; //Bij of Af (quoted)
    obj.desc = items[10].replace(/["']/g, "").trim();

    data.push(obj);
  }
  toTable();
}

function toTable() {

  refined = data.filter(function (row) {
    return parseInt(row.rek) > 0 &&
           //row.name >= 500 &&
           //row.date >= 2 &&
           parseFloat(row.amount) > 0;
  });

  // Bottom.
  var output = "<table><thead><tr><th>Rek</th><th>Name</th><th>Date</th><th>Amount</th><th>Desc</th></tr></thead><tbody>";
  for (var i = 0; i < refined.length; i++) {
    output += "<tr><td>" + refined[i].rek + "</td><td>" + refined[i].name + "</td><td>" + refined[i].date.toLocaleDateString() + "</td><td>&euro; " + refined[i].amount + "</td><td>" + refined[i].desc + "</td></tr>";
  }
  output += "</tbody></table>";
  $('#output').html(output);

  // Top.
  var table = "<table><thead><tr><th>Rek</th><th>Name</th><th>Date</th><th>Amount</th><th>Rent</th><th>Diff</th></tr></thead><tbody>";
  for (var i = 0; i < refined.length; i++) {
    for (var j = 0; j < huurders.length; j++) {
      if (huurders[j].reks.indexOf(refined[i].rek) == -1)
        continue;
      else {
        var diff = (huurders[j].rent - refined[i].amount).toFixed(2); //TODO monthly!!!
        var style = " style='background-color: ";
        if (diff > 0)
          style += "red;'";
        else
          style += "green;'";

        table += "<tr><td>" + refined[i].rek
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
}

function parseDate(str) { //jjjjmmdd
  var arr = [];
  str = str.replace(/[^\d.]/g, ""); //strip non digits
  arr.push(str.substring(0, 4));
  arr.push(str.substring(4, 6));
  arr.push(str.substring(6, 8));

  var date = new Date(arr[0], arr[1] - 1, arr[2]);
  return date;
}

function matchData() {
}

function parseHuurders(text) { // CSV ; separated list.
  huurders = [];

  var rows = text.split('\n');

  for (var r = 0; r < rows.length; r++) {
    var items = rows[r].split(';');
    if (items[3] == undefined || items[3] == "" || !items[3].match(/\d/)) continue; // Skip blank or text only (titles/comments) Accountnumbers.
    var huurder = {};
    huurder.place = items[0];
    huurder.name = items[1];
    huurder.tel = items[2];
    huurder.reks = items[3];
    huurder.rent = items[4].replace(',','.');
    huurder.tel = items[5];
    huurder.mail = items[6];

    huurders.push(huurder);
  }

  localStorage["huurders"] = JSON.stringify(huurders);
}

function showHuurders() {
  var output = "<table><thead><tr><th>Huur</th><th>Name</th></tr></thead><tbody>";
  for (var i = 0; i < huurders.length; i++) {
    output += "<tr onclick='showInfo(" + i + ");'><td>&euro; " + huurders[i].rent + "</td><td>" + huurders[i].name + "</td></tr>";
  }
  output += "</tbody></table>";

  $('#huurderslijst').html(output);
}

function fileReader() {
  if (!window.FileReader) {
    document.getElementById('files').innerHTML = "<p>This browser doesnt support the File API</p>";
    return;
  }

  // Input handler
  $("input:file").on("change", function () {
    readFileAsText(this.files[0], this.id);
  });

  // Drag and drop methods
  $("input:file").on("dragover", function (e) {
    e.preventDefault();
    return false;
  });

  $("input:file").on("drop", function (e) {
    e.stopPropagation();
    readFileAsText(e.dataTransfer.files[0], this.id);
    return false;
  });
}

function readFileAsText(file, id) {
  var reader = new FileReader();
  reader.readAsText(file);

  reader.onload = function (event) {
    if (id == "girotel")
      parseGirotel(event.target.result);
    else
      parseHuurders(event.target.result);
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