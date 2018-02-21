/*
Copyright 2018 rickshory.com
Files modified from work originally Copyright 2016 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
var idbApp = (function() {
  'use strict';

  // check for support
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }

  var dbPromise = idb.open('vegnab-data', 1, (upgradeDB) => {
    switch (upgradeDB.oldVersion) {
      case 0:
        // a placeholder case so that the switch block will
        // excute when the database is first created
        // (oldVersion is 0)
      case 1:
        console.log('Creating the species object store');
        upgradeDB.createObjectStore('NRCS-species', {keyPath: 'Code'});
        var store = upgradeDB.transaction.objectStore('NRCS-species');
        console.log('Creating a Code index, to be able to search on Code');
        store.createIndex('Code', 'Code', {unique: true});
        console.log('Creating a Genus index');
        store.createIndex('Genus', 'Genus');
        console.log('Creating a Species index');
        store.createIndex('Species', 'Species');
        console.log('Creating a SubsppVar index');
        store.createIndex('SubsppVar', 'SubsppVar');
        console.log('Creating a Vernacular index');
        store.createIndex('Vernacular', 'Vernacular');
        console.log('Creating a Distribution index');
        store.createIndex('Distribution', 'Distribution', {multiEntry:true});

//      case 2:

//      case 3:

//      case 4:
//        upgradeDB.createObjectStore('Spp-found', {keyPath: 'id'});
    }
  });

  function logResult(result) {
    console.log(result);
  }

  function logError(error) {
    console.log('Looks like there was a problem: \n', error);
  }

  function addSpecies() {
    // fetch and parse species resource
    console.log('begin addSpecies');
    fetch('res/nrcs_spp.txt')
    .then(validateResponse)
    .then(readResponseAsText)
    .then(parseSppTextIntoArray)
    .then(addSpeciesToObjStore)
//    .then({
//      for (var spp of generateSppItems) {
//        console.log(spp);
//      })
//    })
    .catch(logError);
  }

  function validateResponse(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }

  function parseSppTextIntoArray(responseAsText) {
    var sppItems = [];
    var lines = responseAsText.split(/\r\n|\n/);
    var fieldNames, fields, sppItem, distCodes;
    for (var line = 0; line < lines.length; line++) {
//      console.log(line, lines[line]);
      if (line === 0) {
        fieldNames = lines[line].split('\t');
//        console.log(fieldNames);
      } else {
        fields = lines[line].split('\t');
//        console.log(fields);
        sppItem = {};
        for (var field = 0; field < fields.length; field++) {
          if (field < (fields.length - 1)) { // for all but the last, use as-is
            sppItem[fieldNames[field]] = fields[field];
          } else { // for Distribution, parse into array for multiEntry index
            sppItem[fieldNames[field]] = parseNRCSDistributionIntoArray(fields[field]);
          }
        }
        console.log(sppItem);
        sppItems.push(sppItem);
      }
    }
    return sppItems;
  }

  function parseText(responseAsText) {
//    var results = document.getElementById('results');
//    results.textContent = responseAsText;

    var lines = responseAsText.split(/\r\n|\n/);
    var fieldNames, fields, sppItem, distCodes;
    for (var line = 0; line < lines.length; line++) {
//      console.log(line, lines[line]);
      if (line === 0) {
        fieldNames = lines[line].split('\t');
//        console.log(fieldNames);
      } else {
        fields = lines[line].split('\t');
//        console.log(fields);
        sppItem = {};
        for (var field = 0; field < fields.length; field++) {
          if (field < (fields.length - 1)) { // for all but the last, use as-is
            sppItem[fieldNames[field]] = fields[field];
          } else { // for Distribution, parse into array for multiEntry index
            sppItem[fieldNames[field]] = parseNRCSDistributionIntoArray(fields[field]);
          }
        }
        console.log(sppItem);
      }
    }
  }

  function *generateSppItems(sppText) {
    var lines = sppText.split(/\r\n|\n/);
    var fieldNames, fields, sppItem, distCodes;
    for (var line = 0; line < lines.length; line++) {
//      console.log(line, lines[line]);
      if (line === 0) {
        fieldNames = lines[line].split('\t');
//        console.log(fieldNames);
      } else {
        fields = lines[line].split('\t');
//        console.log(fields);
        sppItem = {};
        for (var field = 0; field < fields.length; field++) {
          if (field < (fields.length - 1)) { // for all but the last, use as-is
            sppItem[fieldNames[field]] = fields[field];
          } else { // for Distribution, parse into array for multiEntry index
            sppItem[fieldNames[field]] = parseNRCSDistributionIntoArray(fields[field]);
          }
        }
//        console.log(sppItem);
        yield sppItem;
      }
    }
  }

  function readResponseAsText(response) {
    return response.text();
  }

  function parseNRCSDistributionIntoArray(dist) {
    // accepts a species' distribution string in NRCS format e.g.
    // 'USA (ME), CAN (LB, NU, QC), DEN (GL)'
    // returns an array of state/province codes for a multiEntry index, e.g.
    // ['ME', 'LB', 'NU', 'QC', 'GL']
    //
    // split by Nation at closing parentheses
    var tmp1 = dist.split(')');
//    console.log(tmp1);
    // remove opening parentheses, and anything before that
    var re = /.*\(/;
    var tmp2 = tmp1.map(a => a.replace(re,''));
//    console.log(tmp2);
    // within each Nation's set, split into individual codes
    var tmp3 = tmp2.map(a => a.split(','));
//    console.log(tmp3);
    // combine all Nations' arrays into one
    var tmp4 = [].concat.apply([], tmp3);
//    console.log(tmp4);
    // trim spaces within strings
    var tmp5 = tmp4.map(a => a.trim());
//    console.log(tmp5);
    // remove any empty strings
    var tmp6= tmp5.filter(Boolean);
//    console.log(tmp6);
    return tmp6;
  }

  //sppItems
  function addSpeciesToObjStore(sppItems) {
    // add objects to the 'NRCS-species' object store
    dbPromise.then((db) => {
      var tx = db.transaction('NRCS-species', 'readwrite');
      var store = tx.objectStore('NRCS-species');
      return Promise.all(sppItems.map((item) => {
          console.log('Adding item: ', item);
          return store.add(item);
        })
      ).catch((e) => {
        tx.abort();
        console.log(e);
      }).then(() => {
        console.log('All items added successfully!');
      });
    });
  }

  function getByDistrib(key) {
    // get all the species for a subnation (state or province)
    var key = document.getElementById('distrib').value;
    if (key === '') {return;}
    var s = '';
    dbPromise.then((db) => {
      var tx = db.transaction('NRCS-species', 'readonly');
      var store = tx.objectStore('NRCS-species');
      var index = store.index('Distribution');
      s += '<h2>' + key + '</h2><p>';
      return index.openCursor(key);
    }).then(function showAll(cursor) {
      if (!cursor) {return;}
      console.log('Cursor at: ', cursor.value.Code);
      s += cursor.value.Code + ': ' +
          cursor.value.Genus + ' ' +
          cursor.value.Species;
      if (cursor.value.SubsppVar !== '') s += ', ' + cursor.value.SubsppVar;
      if (cursor.value.Vernacular !== '') s += ', ' + cursor.value.Vernacular;
      s += '</p>';
      return cursor.continue().then(showAll);
    }).then(() => {
      if (s === '') {s = '<p>No results.</p>';}
      document.getElementById('list').innerHTML = s;
    });
  }

  function getByCode() {
    //  use a cursor to get objects by species code
    var lower = document.getElementById('codeMin').value;
    var upper = document.getElementById('codeMax').value;
    if (lower === '' && upper === '') {return;}
    var range;
    if (lower !== '' && upper !== '') {
      range = IDBKeyRange.bound(lower, upper);
    } else if (lower === '') {
      range = IDBKeyRange.upperBound(upper);
    } else {
      range = IDBKeyRange.lowerBound(lower);
    }
    var s = '';
    dbPromise.then((db) => {
      var tx = db.transaction('NRCS-species', 'readonly');
      var store = tx.objectStore('NRCS-species');
      var index = store.index('Code');
      return index.openCursor(range);
    }).then(function showRange(cursor) {
//    }).then((showRange(cursor)) => {
      if (!cursor) {return;}
      console.log('Cursor at:', cursor.value.name);
      s += '<h2>Code - ' + cursor.value.code + '</h2><p>';
      for (var field in cursor.value) {
        s += field + '=' + cursor.value[field] + '<br/>';
      }
      s += '</p>';
      return cursor.continue().then(showRange);
    }).then(() => {
      if (s === '') {s = '<p>No results.</p>';}
      document.getElementById('list').innerHTML = s;
    });
  }

  function getByDesc() {
    var key = document.getElementById('desc').value;
    if (key === '') {return;}
    var range = IDBKeyRange.only(key);
    var s = '';
    dbPromise.then((db) => {

      // TODO - get species by full text search

    }).then(function() {
      if (s === '') {s = '<p>No results.</p>';}
      document.getElementById('list').innerHTML = s;
    });
  }

  function addToSppList() {
    // TODO write this
  }

  function showSppList() {
    // TODO write this
  }

  function getSppList() {
    // TODO write this
  }

  return {
    dbPromise: (dbPromise),
    logResult: (logResult),
    logError: (logError),
    addSpecies: (addSpecies),
    validateResponse: (validateResponse),
    parseSppTextIntoArray: (parseSppTextIntoArray),
    parseText: (parseText),
    generateSppItems: (generateSppItems),
    readResponseAsText: (readResponseAsText),
    parseNRCSDistributionIntoArray: (parseNRCSDistributionIntoArray),
    addSpeciesToObjStore: (addSpeciesToObjStore),
    getByDistrib: (getByDistrib),
    displayByDistrib: (displayByDistrib),
    getByCode: (getByCode),
    getByDesc: (getByDesc),
    addToSppList: (addToSppList),
    showSppList: (showSppList),
    getSppList: (getSppList)
  };
})();
