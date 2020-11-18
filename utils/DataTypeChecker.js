
const dataTypeChecker = (data, debug = false) => {
    const log = console.log;
    let result = ``;
    const typeString = Object.prototype.toString.call(data);
    result = typeString.replace(/\[object /gi, ``).replace(/\]/gi, ``);
    if(debug) {
      log(`true type`, result)
    }
    return result;
  };


function isEmptyObject(value) {
    return Object.keys(value).length === 0 && value.constructor === Object;
  }

export default dataTypeChecker;

export {
  dataTypeChecker,
  isEmptyObject
};