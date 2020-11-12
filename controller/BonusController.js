import boom from "boom";
import fetch from "node-fetch";
import Clients from "../models/Client.js";
import jsondiffpatch from 'jsondiffpatch';

const API_1C_BONUS_CLIENT_URL = "http://62.168.226.38:7599/testbd/hs/bonus/";
const MAIN_DATABASE_URL = "https://5fabd04903a60500167e724e.mockapi.io/testbd/hs/bonus/";

global.Headers = fetch.Headers;

export class BonusController {
  constructor() {
    this.retryCodes = [408, 500, 502, 503, 504, 522, 524];
    this.verifyClient = this.verifyClient.bind(this);
    this.myHeaders = new Headers();
    this.myHeaders.append("Authorization", "Basic dHJhY2s6NTZxdHA3");
    this.requestOptions = {
      method: "GET",
      headers: this.myHeaders,
      redirect: "follow"
    };
    /*this.remoteClientSync = loopback.createDataSource({
      url: `${MAIN_DATABASE_URL}clients`,
      connector: loopback.Remote
     });*/
  }

  //рекурсивная проверка статуса сервера
  async checkClientVerification(req, retries = 3, backoff = 300) {
    return fetch(
      `${API_1C_BONUS_CLIENT_URL}getclient?phone=${req.query.phone}&barcode=${req.query.barcode}`,
      this.requestOptions
    )
      .then((response) => {
        if (retries > 0 && this.retryCodes.includes(response.status)) {
          setTimeout(() => {
            return this.checkClientVerification(req, retries - 1, backoff * 2);
          }, backoff);
        }
        if (response.ok) {
          console.log(`сервер ответил ОК`);
          return response.text();
        }
      })
      .then((text) => {
        return text;
      })
      .catch((error) => boom.boomify(error));
  }

  //метод  для проверки клиента в оффлайн базе, если 1С не доступна
  async verifyClient(req, reply) {
    if (req.query.phone === undefined || req.query.barcode === undefined) {
      let err = new Error("Not found: phone and barcode required");
      err.status = 404;
      return err;
    }
    console.log(req.query);
    //запрос к 1С
    let clientVerificationData = await this.checkClientVerification(req);
    if (!clientVerificationData) {
      let clientDoc = await this.verifyClientInMongo(req);
      //карту не нашли
      if (!clientDoc) {
        return { Error: "Бонусная карта не найдена" }.json();
      }
      return { Code1C: clientDoc.code1C, Success: clientDoc.fullName }.json();
    } else return clientVerificationData;
  }

  //добавление поля во все документы 
  //на вход функции подается пример нового формата данных jsonPatternData
  //берется сампл старого формата данных
  async syncMongoDBTableAddField (jsonPatternData, jsonPatternOld = await documentModel.fineOne(), documentModel) {

    let deltaToAdd = jsondiffpatch.diff(jsonPatternData, jsonPatternOld);

      switch (typeof jsonPatternData.field) {
        case string:
          documentModel.update({},
          {$set: {field: "NaN"}}, 
          false, true);
        break;

        case object:
          
        break;
      
        default:
          break;
      }
  }

  syncMongoDBTableDeleteField (field, documentModel) {

  }

  syncMongoDBTableUpdateFieldName (fieldNew, fieldOld, documentModel) {

  }


  //поиск записи в таблице клиента mongodb (асинхронно)
  async verifyClientInMongo(req) {
    const findClient = Client.findOne(
      {
        phone: req.query.phone,
        cards: { barcode: req.query.barcode, active: true },
      },
      [{ code1C: true, fullName: true }]
    ).then((res) => {
      if (res === null) return false;
      return res;
    });
  }

  async fetchAllClients(req, reply) {
    let clients = await fetch(`${API_1C_BONUS_CLIENT_URL}`);
  }
}
