import boom from "boom";
import fetch from "node-fetch";
import isEmptyObject, { dataTypeChecker } from "../utils/DataTypeChecker.js";
import Boom from "boom";

const API_1C_BONUS_CLIENT_URL = "http://62.168.226.38:7599/testbd/hs/bonus/";
const MAIN_DATABASE_URL =
  "https://5fabd04903a60500167e724e.mockapi.io/testbd/hs/bonus/";

global.Headers = fetch.Headers;

export class BonusController {
  constructor(mongo) {
    this.retryCodes = [408, 500, 502, 503, 504, 522, 524];
    this.myHeaders = new Headers();
    this.myHeaders.append("Authorization", "Basic dHJhY2s6NTZxdHA3");
    this.mongo = mongo;
    this.requestOptions = {
      method: "GET",
      headers: this.myHeaders,
      redirect: "follow",
    };

    this.verifyClient = this.verifyClient.bind(this);
    //this.chageTableProperties = this.chageTableProperties.bind(this);
  }


  //рекурсивная проверка статуса сервераs
  async checkClientVerification(req, res, retries = 3, backoff = 300) {
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
  async verifyClient(req, res, reply) {
    if (req.query.phone === undefined || req.query.barcode === undefined) {
      let err = new Error("Not found: phone and barcode required");
      err.status = 404;
      return err;
    }
    console.log(req.query);
    //запрос к 1С
    let clientVerificationData = await this.checkClientVerification(req, res);
    if (!clientVerificationData) {
      let clientDoc = await this.verifyClientInMongo(req);
      //карту не нашли
      if (!clientDoc) {
        return { Error: "Бонусная карта не найдена" }.json();
      }
      return { Code1C: clientDoc.code1C, Success: clientDoc.fullName }.json();
    } else return clientVerificationData;
  }

  //поиск записи в таблице клиента mongodb (асинхронно)
  async verifyClientInMongo(req) {
    
    const findClient = clients
      .findOne(
        {
          phone: req.query.phone,
          cards: { barcode: req.query.barcode, active: true },
        },
        [{ code1C: true, fullName: true }]
      )
      .then((res) => {
        if (res === null) return false;
        return res;
      });
  }






}
