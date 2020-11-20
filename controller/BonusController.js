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
    this.chageTableProperties = this.chageTableProperties.bind(this);
  }

  async queryData(req, res) {
    if (!req.query.collection) {
      return Boom.boomify(new Error(), {
        statusCode: 404,
        message: "Параметр collection не указан",
      });
    }
    const collection = this.mongo.model(req.query.collection);
    let query = {},
      projection = {};
    let check =
      req.query.collection === "User"
        ? res
            .status(500)
            .send({
              statusCode: 500,
              message: "Not gonna give you all the users :)",
            })
        : (projection = { _id: 0, __v: 0 });
    if (req.query.select) {
      query = req.query.select;
    }
    if (req.query.projection) {
      projection = { ...JSON.parse(req.query.projection), ...projection };
    }

    const queryResult = await collection
      .find(query, projection)
      .lean()
      .exec(function (err, doc) {
        if (err) {
          return Boom.boomify(err, {
            message: "ошибка во время запроса (╯°□°）╯︵ ┻━┻",
          });
        }
        return res.status(200).send(JSON.stringify(doc));
      });
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

  async createKey(req, res, collection) {
    let type = dataTypeChecker(req.body.new_key);
    let addNewField;

    switch (type) {
      case "String":
        addNewField = await collection.schema.add({
          [req.body.new_key]: "String",
        });
        break;

      case "Array":
        addNewField = await collection.schema.add({
          [req.body.new_key]: "Array",
        });
        break;

      case "Object":
        addNewField = await collection.schema.add({
          [req.body.new_key]: "Object",
        });
        break;

      default:
        return Boom.methodNotAllowed("Только Array, Object или String");
        break;
    }

    if (type === "String") {
      //const aggregate = collection.aggregate.addFields([{[req.body.new_key]: 'default_value' }]);
      // collection.update();
    } else if (type === "Array") {
      return res.status(200).json(collection.schema.paths);
    } else {
      return Boom.methodNotAllowed(
        "Метод принимает одно новое поле или массив новых полей в поле new_key методом POST"
      );
    }
  }

  async deleteKey(req, res, collection) {}

  async updateKey(req, res, collection) {}

  async chageTableProperties(req, res, next) {
    if (!req.body.collection) return;
    //const db = fastify.mongo.db;
    let collection = this.mongo.model(req.body.collection);
    switch (req.body.operation) {
      case "add_property":
        return await this.createKey(req, res, collection);
      case "delete_property":
        return await this.deleteKey(req, res, collection);
      case "update_property":
        return await this.updateKey(req, res, collection);
      case "create_table":
        return await this.createTable(req, res, collection);
      default:
        return Boom.methodNotAllowed(
          "операция не указана, или указана не верно\n доступные операции add|delete|update_property, create_table"
        );
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
