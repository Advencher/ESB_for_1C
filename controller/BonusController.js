import boom from "boom";
import fetch from "node-fetch";
import ClientJournal from "../models/Client.js";
import jsondiffpatch from "jsondiffpatch";
import isEmptyObject, { dataTypeChecker } from "../utils/DataTypeChecker.js";
import { json } from "body-parser";

const API_1C_BONUS_CLIENT_URL = "http://62.168.226.38:7599/testbd/hs/bonus/";
const MAIN_DATABASE_URL =
  "https://5fabd04903a60500167e724e.mockapi.io/testbd/hs/bonus/";

global.Headers = fetch.Headers;

export class BonusController {
  constructor() {
    this.retryCodes = [408, 500, 502, 503, 504, 522, 524];
    this.verifyClient = this.verifyClient.bind(this);
    this.chageTableProperties = this.chageTableProperties.bind(this);
    this.myHeaders = new Headers();
    this.myHeaders.append("Authorization", "Basic dHJhY2s6NTZxdHA3");
    this.requestOptions = {
      method: "GET",
      headers: this.myHeaders,
      redirect: "follow",
    };
  }

  //рекурсивная проверка статуса сервера
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
        return res.status(200).json(text);
      })
      .catch((error) => boom.boomify(error));
  }

  //метод  для проверки клиента в оффлайн базе, если 1С не доступна
  async verifyClient(req, res,  reply) {
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

  async createKey(req, res, collection) {
  
    let type = dataTypeChecker(req.params.new_key);
    if (type === 'String') {

      collection.aggregate(
        { $addFields: { [req.params.new_key]: 'default_value' }},
      );
      return  res.status(200).json(collection.schema.paths);

    } else if (type === 'Array') {
      
      for (let key in req.params.new_key) {
        collection.aggregate(
          { $addFields: { [key]: 'default_value' }},
        );
      }
      return res.status(200).json(collection.schema.paths);

    } else {
      return Boom.methodNotAllowed("Метод принимает одно новое поле или массив новых полей в поле new_key методом POST");
    };

  }

  async deleteKey(req, res, collection) {


  }

  async updateKey(req, res, collection){


  }

  async chageTableProperties(req, res, next) {

    if (!req.params.collection) return 
    let collection = this.mongo.db.getCollection(req.params.collection);
    switch (req.params.operation) {
      case "add_property":
        return await this.createKey(req, res, collection);
        break;

      case "delete_property":
        return await this.deleteKey(req, res, collection);
        break;

      case "update_property":
        return await this.updateKey(req, res, collection);
        break;

      case "create_table":
        return await this.createTable(req, res, collection);
        break;

      default:
        return Boom.methodNotAllowed(
          "операция не указана, или указана не верно\n доступные операции add|delete|update_property, create_table"
        );
        break;
    }

    if (isEmptyObject(req.query)) {
      //get pattern data (надо заменить на получение структуры талицы)
      let dataFrame = [];
    }
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

  async fetchAllClients(req, reply) {
    let clients = await fetch(`${API_1C_BONUS_CLIENT_URL}`);
  }
}

// const tableModel = await fetch(`${MAIN_DATABASE_URL}clients`);
// if (tableModel.ok) {
//   dataFrame = await tableModel.json();
// } else {
//   alert("Ошибка HTTP: " + response.status);
// }

// let doc = ClientJournal.findOne();
// let delta = jsondiffpatch.diff(doc.schema.paths, dataFrame[10]);
// const ignoreKeys = ['__v', '_id', '__proto__'];

