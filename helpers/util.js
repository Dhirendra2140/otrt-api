const moment = require('moment');
const {uploads: {profileImageURL, appLogoImageURL, documentsURL}} = require(`../config/config`);
const _ = require('lodash');

module.exports = {

  toTitleCase: input => input.length === 0 ? `` :
    input.replace(/\w\S*/g, (txt => txt[0].toUpperCase() + txt.substr(1).toLowerCase())),

  generateFilename: (profileImage, isProfile, isDoc) => {
    const date = new Date();
    const randomName = `${date.getFullYear()}${(date.getMonth() + 1)}${date.getDate()}_${date.getHours()}${date.getMinutes()}${date.getSeconds()}`;
    const fileType = ((profileImage).split(`;`)[0]).split(`/`)[1];
    const base64 = ((profileImage).split(`base64,`)[1]);
    const url = isProfile ?
      `${profileImageURL}${randomName}.${fileType}` :
      (isDoc ?
        `${documentsURL}${randomName}.${fileType}` :
        `${appLogoImageURL}${randomName}.${fileType}`);
    return {base64, url};
  },

  // To get age from Date
  getAgeFromDOB: (DOB) => {
    let age = moment().diff(moment(DOB, "MM-DD-YYYY"), 'years', true);
    age = parseInt(age);
    return age;
  },

  // To get age from Date
  getAgeFromDOBAndFromDate: (eachMonthValue, DOB) => {
    let age = Math.floor(moment(new Date('01/' + eachMonthValue)).diff(moment(DOB,"DD/MM/YYYY"),'years',true));
    return age;
  },

  validateIntegerValue: (nutritionValue) => {
    let modifiedNutritionValue = '';
    if (nutritionValue == null || isNaN(nutritionValue)) {
      modifiedNutritionValue = '';
    } else {
      modifiedNutritionValue = nutritionValue.toFixed(2);
      modifiedNutritionValue = parseFloat(modifiedNutritionValue);
    }
    return modifiedNutritionValue;
  },

  changeIntoNumberType: (number) => {
    let modifiedValue;

    if (number != '' || number != null || number != 0) {
      modifiedValue = number.toFixed(2);
      modifiedValue = parseFloat(modifiedValue);
    }
    return modifiedValue;
  },

  convertIntoNumberType: (number) => {
    let modifiedValue;

    if (number != '' || number != null || number != 0) {
      modifiedValue = number.toFixed(2);
      modifiedValue = parseFloat(modifiedValue);
    }
    if (number == null || isNaN(number)) {
      modifiedValue = '';
    }
    return modifiedValue;
  },

  getIntervalDate: (date, interval) => {
    return moment(date)
    .add(interval, 'days')
  },

  modifyResult: (userData, key, month, year, bestMonthKey) => {

    let eachUserDetailObject = {};
    let currentMonth = moment.utc(new Date()).month();
    let currentYear = moment.utc(new Date()).year();
    let eachUserTotalMonthAttendanceArray = [];
    let allMonthsAttendanceTotal = 0;
    let totalUserObjectCount = userData[key].length;

    // TO set default values to the data
    eachUserDetailObject['currentMonth'] = '';
    eachUserDetailObject['firstMonth'] = '';
    eachUserDetailObject['lastMonth'] = '';
    eachUserDetailObject['bestMonth'] = '';
    eachUserDetailObject['averageMonth'] = '';

    /*
     * To iterate each training Attendance data
     * */
    userData[key].map((eachTrainingData, index) => {
      /*
       * To get current month data based on Current month and Current year
       * */
      if (eachTrainingData.year === parseInt(year) && eachTrainingData.month === parseInt(month)) {
        eachUserDetailObject['currentMonth'] = userData[key][index].currentMonthValue;
      }
      /*
       * To get first month data of the records
       * */
      if (eachTrainingData.isFirstYear && eachTrainingData.isFirstMonth) {
        eachUserDetailObject['firstMonth'] = userData[key][index].currentMonthValue;
      }
      // To set last month data for the eachUserDetailObject
      if ((eachTrainingData.month === parseInt(month)) && (eachTrainingData.year === parseInt(year))) {
        if (totalUserObjectCount === 1) {
          eachUserDetailObject['lastMonth'] = '';
        }
        if (totalUserObjectCount > 1) {
          eachUserDetailObject['lastMonth'] = userData[key][totalUserObjectCount - 2].currentMonthValue;
        }
      } else {
        eachUserDetailObject['lastMonth'] = userData[key][totalUserObjectCount -1].currentMonthValue;
      }

      /*
       * To check current month and current year data
       * */
      currentMonth = currentMonth + 1;
      // if (eachTrainingData.year <= currentYear) {
        eachUserTotalMonthAttendanceArray.push(userData[key][index].currentMonthValue);
        if (typeof userData[key][index].currentMonthValue === 'number') {
          allMonthsAttendanceTotal = allMonthsAttendanceTotal + userData[key][index].currentMonthValue;
        }
      // }
    });

    // To sort Training Attendance Array data
    eachUserTotalMonthAttendanceArray = eachUserTotalMonthAttendanceArray.sort();
    // To calculate Training Attendance length data
    if (typeof userData[key][0].currentMonthValue === 'number') {
      let allMonthsAttendanceLength = eachUserTotalMonthAttendanceArray.length;
      let averageData = allMonthsAttendanceTotal / allMonthsAttendanceLength;
      averageData = averageData.toFixed(2);
      averageData = parseFloat(averageData);

      /*
       * To set averageMonth data and bestMonth for the eachUserDetailObject
       * */
      eachUserDetailObject['averageMonth'] = averageData;
      if (bestMonthKey === 'higher') {
        eachUserDetailObject['bestMonth'] = Math.max.apply(null, eachUserTotalMonthAttendanceArray);
      }
      if (bestMonthKey === 'lower') {
        eachUserDetailObject['bestMonth'] = Math.min.apply(null, eachUserTotalMonthAttendanceArray);
      }
    }
    if (typeof userData[key][0].currentMonthValue === 'string') {
      /*
       * To set averageMonth data and bestMonth for the eachUserDetailObject
       * */
      eachUserDetailObject['averageMonth'] = eachUserTotalMonthAttendanceArray[eachUserTotalMonthAttendanceArray.length - 1];
      eachUserDetailObject['bestMonth'] = eachUserTotalMonthAttendanceArray[eachUserTotalMonthAttendanceArray.length - 1];
    }
    return eachUserDetailObject;
  },

  /*
  * To get previous months data
  * */
  getPreviousMonthsData: (monthArrayData, currentDate) => {
    let previousMonthsArrayData = [];
    let allPreviousMonthsObjData = {};
    let eachMonthsArray = [];
    let allMonthsNumberArray = [];
    let allMonthsNumbersData = [];

    currentDate = moment(currentDate).format('YYYY-MM-DD');

    // Iterate for 5 times
    for (let i = 0; i < 5; i++) {
      let dateToFind = moment(currentDate).subtract(i, 'months').startOf('month').format('YYYY-MM-DD');
      let isFound = _.find(monthArrayData, function (eachObj) {
        let objectDate = eachObj.year + '-' + eachObj.month + '-' + '01';
        objectDate = moment(objectDate).format('YYYY-MM-DD');
        return new Date(dateToFind).getTime() === new Date(objectDate).getTime();
      });
      if (isFound) {
        previousMonthsArrayData.push(isFound);
      } else {
        let emptyMonthObj = {
          currentMonthValue: '',
          monthName: '',
          isFirstMonth: false,
          isFirstYear: false,
          month: new Date(dateToFind).getMonth() + 1,
          year: new Date(dateToFind).getFullYear()
        };
        previousMonthsArrayData.push(emptyMonthObj);
      }
    }
    // Reverse the months data
    previousMonthsArrayData = previousMonthsArrayData.reverse();

    previousMonthsArrayData.map((eachMonthData) => {
      let yearValue;
      eachMonthsArray.push(eachMonthData.currentMonthValue);
      allMonthsNumberArray.push(('0' + eachMonthData.month).slice(-2) + '/' + eachMonthData.year.toString().substr(-2));
      allMonthsNumbersData.push(eachMonthData.month + '/' + eachMonthData.year);
    });
    allPreviousMonthsObjData = {
      eachMonthsArray: eachMonthsArray,
      allMonthsNumberArray: allMonthsNumberArray,
      allMonthsNumbersData: allMonthsNumbersData
    };
    return allPreviousMonthsObjData;
  },
};
