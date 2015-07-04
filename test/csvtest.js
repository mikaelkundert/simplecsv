/*jshint expr: true*/
var simplecsv = require('../simplecsv'),
    csvdata = simplecsv.csvdata,
    csv = simplecsv.csv,
    private = require('../lib/private'),
    inputtestJSON = require('./testcases_as_csv.json'),
    parsedtestJSON = require('./parsed_testcases_as_arrays.json');

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);

var csv = new csv();
var private = new private();

describe('SimpleCsv.js Unit Test', function() {

  it('(csvdataToJSON and JSONToCsvdata) should return a true representation of csv in JSON', function(){
    var test  = csv.makeCsvdataFromObj({ columnNames : [ '11', '12' ],
                                         rows : [ [ '4', 0 ], [ '5', 0 ] ],
                                         rowCount : 2 ,
                                         columnCount: 2 });
    var actualOutput = csv.csvdataToJSON(test);
    var expectedOutput = '[{"11":"4","12":0},{"11":"5","12":0}]';
    expect(actualOutput).eql(expectedOutput);
    var actualConvertedCsvdata = csv.JSONToCsvdata(actualOutput);
    expect(actualConvertedCsvdata).eql(test);
  });

  it('(csvdataToJSON) should generate zero padded column names when no column names', function(){
    var test  = csv.makeCsvdataFromObj({ rows : [ [ '4', 0 ], [ '5', 0 ] ],
                                         rowCount : 2 ,
                                         columnCount: 2 });
    var actualOutput = csv.csvdataToJSON(test);
    var expectedOutput = '[{"Col 0":"4","Col 1":0},{"Col 0":"5","Col 1":0}]';
    expect(actualOutput).eql(expectedOutput);
    var actualConvertedCsvdata = csv.JSONToCsvdata(actualOutput);
    expect(actualConvertedCsvdata).not.eql(test);
    test.columnNames = [ 'Col 0', 'Col 1'];
    expect(actualConvertedCsvdata).eql(test);
  });

  it('(findErrors) should find errors', function() {
    var test  = csv.makeCsvdataFromObj({ columnNames : [ '1', '2' ],
                                         rows : [ [ 3, '4' ], [ '5' ] ],
                                         rowCount : 10 ,
                                         columnCount: 22});
    var actualOutput = csv.findErrors(test);
    var expectedOutput = [
      "Type mismatch at row:1 col:0 expected:number actual:string",
      "Column count is 22 but Row 0 has 2 cols",
      "Row 1 has 1 cols, Row 0 has 2"];
    expect(actualOutput).eql(expectedOutput);
  });

  it('(private.getArg) should work', function() {
    var argdic = { hasHeaders: true , movement: 'yes' };
    expect(private.getArg(argdic, 'hasHeaders', false)).to.be.true;
    expect(private.getArg(argdic, 'myflag', false)).to.be.false;
    expect(private.getArg(argdic, 'movement', 'no')).equal('yes');
    expect(private.getArg(argdic, 'movement', 1)).equal(1);
  });

  it('(private.doubleQuoteIfNecessary) should respect Wikipedia guidelines', function() {
    var input = [ '   ', ' \r \n ', ' " ', ' "" ', ' """ ', 'Asd feg', 'Yoga\r\n'];
    var expectedOutput = [ '   ', '" \r \n "', '" "" "',
                           '" """" "', '" """""" "', 'Asd feg', '"Yoga\r\n"'];
    for (var i = 0; i < input.length; i++) {
      expect(private.doubleQuoteIfNecessary(input[i])).to.be.equal(expectedOutput[i]);
    }
  });

  it('(parseString) should handle hasHeaders correctly', function() {
    var argdic = { hasHeaders: true };
    var realOutput = csv.parseString('1,2\n3,4\n', argdic);
    var expectedOutput = csv.makeCsvdataFromObj({ columnNames : [ '1', '2' ],
                                                  rows : [ [ '3', '4' ] ],
                                                  rowCount : 1 ,
                                                  columnCount: 2 });
    expect(realOutput).to.eql(expectedOutput);
    
    argdic = { hasHeaders: false };
    realOutput = csv.parseString('1,2\n3,4\n', argdic);
    expectedOutput = csv.makeCsvdataFromObj({ rows : [ [ '1', '2' ], [ '3', '4' ] ],
                                              rowCount : 2 ,
                                              columnCount: 2 });
    expect(realOutput).to.eql(expectedOutput);
  }); 

  it('(private.parseStringToArray) should parse csv cases in testcases_as_csv.json', function() {
    // Read the expected values from parsedtestJSON
    var expectedResults = {};
    var expectedResultsAsString = {};
    var parsedcases = parsedtestJSON.parsedcases;
    for (var j = 0; j < parsedcases.length; j++) {
      var testObj = parsedcases[j];
      expectedResults[testObj.testname] = testObj.instances;
      expectedResultsAsString[testObj.testname] = testObj.instancesAsString;
    }

    var testcases = inputtestJSON.testcases;
    for (var i = 0; i < testcases.length; i++) {
      var myObj = testcases[i];
      var expected = expectedResults[myObj.testname];
      var expectedAsString = expectedResultsAsString[myObj.testname];
      var toBeParsed = myObj.instances;
      var argdic = {};
      if (typeof myObj.hasComments !== 'undefined') {
        argdic.hasComments = myObj.hasComments;
      }
      if (typeof myObj.delim !== 'undefined') {
        argdic.delim = myObj.delim;
      }
      for (var k = 0; k < toBeParsed.length; k++) {
        var output = private.parseStringToArray(toBeParsed[k], argdic);
        var msg = 'ParseStringToArray TEST: Testname(' + myObj.testname + ') ' +
              ' argdic(' + JSON.stringify(argdic) + ') ' +
              ' index(' + k + ') ' +
              ' Instance(' + JSON.stringify(toBeParsed[k]) + ') ' +
              ' Real_Output( ' + JSON.stringify(output) + ') ' +
              ' Expected( ' + JSON.stringify(expected[k]) + ') ';
        expect(output).to.eql(expected[k], msg);
        // Check if the csvdataToString works
        var myCsvdata = csv.makeCsvdataFromObj({ rows: output});
        output = csv.csvdataToString(myCsvdata, argdic);
        msg = 'CsvdataToString TEST: Testname(' + myObj.testname + ') ' +
              ' argdic(' + JSON.stringify(argdic) + ') ' +
              ' index(' + k + ') ' +
              ' Instance(' + JSON.stringify(toBeParsed[k]) + ') ' +
              ' CsvdataToString_Output( ' + JSON.stringify(output) + ') ' +
              ' Expected_InstanceInString( ' + JSON.stringify(expectedAsString[k]) + ') ';
        expect(output).to.eql(expectedAsString[k], msg);
      }
    }
  });
});