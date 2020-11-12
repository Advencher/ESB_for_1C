
import jsondiffpatch, { console } from 'jsondiffpatch';

let old = {
    "id": "1",
    "fullName": "Имя1 Фамилия1 Отчество1",
    "phone": "phone1",
    "cards": [
      {
        "barcode": "disabled_code1",
        "active": "false"
      },
      {
        "barcode": "enabled_code1",
        "active": "ture"
      }
    ],
    "Code1C": "code1Ctest1"
  };


let updated = {
    "newField": "hello",
    "id": "1",
    "fullName": "Имя1 Фамилия1 Отчество1",
    "phone": "phone1",
    "cards": [
        {
          "barcode": "disabled_code1",
          "active": "false"
        },
        {
          "barcode": "enabled_code1",
          "active": "ture"
        }
      ],
    "Code1C": "code1Ctest1",
    
  };


function syncTable(tableName = "default") {

}

function syncMongoDBTableAddField (jsonPatternData, jsonPatternOld) {

    //это нужно сделать ДО вызова функции
    let delToAdd = jsondiffpatch.diff(jsonPatternData, jsonPatternOld);
    console.log(JSON.parse(delToAdd));

    for (const prop in delToAdd) {
        if (Object.prototype.hasOwnProperty.call(jsonPatternOld, prop)) {
        // do stuff
        continue;
        }
        else {
            console.log(typeof delToAdd[prop]);

            switch (typeof delToAdd[prop]) {
                case 'string':
                console.log("string");
                // documentModel.update({},
                // {$set: {field: "NaN"}}, 
                // false, true);
                break;

                case 'object':
                console.log("object");
                break;
              
                default:
                console.log(typeof delToAdd[prop][0]);
                break;
              }

        }
    }

  
  }


  syncMongoDBTableAddField(updated, old)