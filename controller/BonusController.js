import boom from "boom";
import fetch from "node-fetch";
import Boom from "boom";
import {ApiRequestManager} from "./ServerManager.js"
import nconf from "nconf";

const API_1C_BONUS_CLIENT_URL = "http://62.168.226.38:7599/testbd/hs/bonus/";
const MAIN_DATABASE_URL =
  "https://5fabd04903a60500167e724e.mockapi.io/testbd/hs/bonus/";

global.Headers = fetch.Headers;

export class BonusController {
  constructor(mongoNative) {
    this.retryCodes = [408, 500, 502, 503, 504, 522, 524];
    this.apiRequestManager = new ApiRequestManager();
    this.myHeaders = new Headers();
    this.myHeaders.append("Authorization", "Basic dHJhY2s6NTZxdHA3");
    this.mongoNative = mongoNative;
    this.factoryAPI = this.factoryAPI.bind(this);
    this.apiClient = this.apiClient.bind(this);
    this.requestOptions = {
      method: "GET",
      headers: this.myHeaders,
      redirect: "follow",
    };
    this.verifyClient = this.verifyClient.bind(this);
    this.tokenOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        name: "retard",
        password: "testpassword",
      }),
    };
    nconf.argv().env();
    nconf.file({ file: './config/server_config.json' });
    nconf.defaults({
        'http': {
          'serverAddress': 'localhost',
          'serverPort': 3000
        }
    });
    this.nconf = nconf;


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

  //поиск записи в таблице клиента mongodb
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

  //регистрация API works 100%
  async factoryAPI(req, res) {
    //если есть параметер с коллекцией
    if (req.body.collection) {
      const token = req.headers["x-access-token"];
      const urlInsertApi = `http://${this.nconf.get('http:serverAddress')}:${this.nconf.get('http:serverPort')}/app/crud?collection=apies`;
      let checkForName = await this.mongoNative
        .db("rapid_1c_requests")
        .listCollections({ name: req.body.collection })
        .toArray();
      let _fieldsAndValues;
      let response_structure = req.body.apiStructure.response_structure;

      //если такая коллекия уже есть
      if (checkForName.length != 0) {
        return res.status(200).send({ message: "такой API уже подключен" });
      }
      try {
        _fieldsAndValues = {
          api_url: req.body.apiStructure.api_url,
          method: req.body.apiStructure.method,
          collection: req.body.collection,
          headers: req.body.apiStructure.headers,
          bodyparams: req.body.apiStructure.bodyparams,
          urlparams: req.body.apiStructure.urlparams,
        };
      } catch (error) {
        return Boom.boomify(error);
      }
      const createApiReserve = `http://${this.nconf.get('http:serverAddress')}:${this.nconf.get('http:serverPort')}/app/table_factory?collection=${req.body.collection}`;

      let insertRequestOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          changes: { fieldsAndValues: _fieldsAndValues },
          operation: "insert",
        }),
      };

      let optionsCreateTable = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          options: response_structure,
          operation: "create_table",
        }),
      };

      let makeApiTable = await fetch(createApiReserve, optionsCreateTable);

      let resultMakeTable = await makeApiTable.json();
      if (resultMakeTable.Success) {
        let insertApiRes = await fetch(urlInsertApi, insertRequestOptions);
        insertApiRes = await insertApiRes.json();
        if (insertApiRes.Success) {
          return res.status(200).send({
            apiTableName: `имя таблицы в бд и имя API для передачи в запрос - ${req.body.collection}`,
            Success: `API для 1C c относительным URL </${_fieldsAndValues.api_url}> зарегестрирован`,
            ..._fieldsAndValues,
          });
        } else {
          return res.status(500).send({
            apiRegistrationResult: insertApiRes,
            message: `ошибка при регистрации API (insert в таблицу apies завершился с ошибкой) ${req.body.collection}, удалите таблицу с соответствующим именем`,
          });
        }
      } else {
        return Boom.boomify(makeApiTable, {
          message: "при регистрации API возникала ошибка",
        });
      }
    }
  }

  async apiClient(req, res) {
    if (!req.query.api_name) return Boom.badRequest("укажите api_name");
    let apiProvider = await this.mongoNative
      .db("rapid_1c_requests")
      .collection("apies")
      .findOne({ collection: req.query.api_name });
    try {
      if (req.body.bodyparams) {
        let counterKey = 0;
        for (let key in req.body.bodyparams) {
          counterKey++;
          if (!apiProvider.bodyparams.includes(key))
            return res.status(200).send({
              Failure: `ключ <${key}> не найден для BODY запроса - ${req.query.api_name} не совпадает с зарегестрированным ключом`,
            });
        }

        if (counterKey !== apiProvider.bodyparams.length)
          return res.status(200).send({
            Failure: `количество предоставленных ключей для BODY запроса - ${req.query.api_name} не совпадает с зарегестрированным количеством`,
          });
      }
      if (req.body.urlparams) {
        let counterKey = 0;
        for (let key in req.body.urlparams) {
          counterKey++;

          if (!apiProvider.urlparams.includes(key))
            return res.status(200).send({
              Failure: `ключ <${key}> не найден для URL - ${req.query.api_name} не совпадает с зарегистрированным ключом`,
            });
        }

        if (counterKey !== apiProvider.urlparams.length)
          return res.status(200).send({
            Failure: `количество предоставленных ключей для URL запроса - ${req.query.api_name} не совпадает с зарегестрированным количеством`,
          });
      }
    } catch (error) {
      return Boom.boomify(error);
    }
    let requestOptions = {
      method: apiProvider.method, //метод POST, GET, ...
      headers: apiProvider.headers, //авторзация в API
      redirect: "follow", //редирект
      body: JSON.stringify(req.body.bodyparams),
    };

    let urlAPI = `${apiProvider.api_url}`;
    if (req.body.urlparams) {
      let index = 0;
      urlAPI += `?`;
      for (let param of apiProvider.urlparams) {
        urlAPI += `${param}=${req.body.urlparams[param]}`;
        index++;

        if (index !== apiProvider.urlparams.length) urlAPI += `&`;
      }
    }
    try {
      let requestApi = await this.apiRequestManager.checkAPIForUp(
        urlAPI,
        requestOptions
      );
      let apiReserve = await this.mongoNative
        .db("rapid_1c_requests")
        .collection(apiProvider.collection);
      let memento = {};
      if (req.body.bodyparams) memento.bodyparams = req.body.bodyparams;
      if (req.body.urlparams) memento.urlparams = req.body.urlparams;

      if (requestApi.serverError) {
        let searchForLatestEntry;
        searchForLatestEntry = await apiReserve.findOne(
          { memento: memento },
          { _id: 0, sort: { $natural: -1 }, limit: 1 }
        );
        if (searchForLatestEntry) {
          return JSON.stringify({ ...searchForLatestEntry, ...requestApi });
        } else {
          return JSON.stringify({
            Error: `1C не доступна и в базе отсутcтвуют актуальные данные `,
            apiName: apiProvider.collection,
            usedURL: urlAPI,
            ...requestApi,
          });
        }
      }
      if (requestApi.myFlag) {
        delete requestApi.myFlag;
        let combinedEntry = { ...requestApi, memento: memento };
        let insertToApiReserve = await apiReserve.findOneAndReplace(
          { memento: combinedEntry.memento },
          combinedEntry,
          { upsert: true }
        );
        if (insertToApiReserve.ok) {
          return res
            .status(200)
            .send(JSON.stringify({ ...requestApi, memento: memento }));
        }
      }
    } catch (error) {
      return Boom.boomify(error);
    }
  }

  //api для синхронизации c 1C
  async insertApi(req, res) {
    if (!req.query.api_name)
      return Boom.badRequest("укажите название API в api_name");
    let apiProvider = await this.mongoNative
      .db("rapid_1c_requests")
      .collection("apies")
      .findOne({ collection: req.query.api_name });

    let insertRequestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
      body: JSON.stringify({
        changes: { fieldsAndValues: req.body.data },
        operation: "insert",
      }),
    };

    //формирование запроса
    let requestOptions = {
      method: apiProvider.method, //метод POST, GET, ...
      headers: apiProvider.headers, //авторзация в API
      redirect: "follow", //редирект
      body: JSON.stringify(req.body.bodyparams),
    };
    //формирование ссылки на запрос
    let urlAPI = `${apiProvider.api_url}`;
    if (req.body.urlparams) {
      let index = 0;
      urlAPI += `?`;
      for (let param of apiProvider.urlparams) {
        urlAPI += `${param}=${req.body.urlparams[param]}`;
        index++;

        if (index !== apiProvider.urlparams.length) urlAPI += `&`;
      }
    }

    let requestApi = await this.apiRequestManager.checkAPIForUp(
      urlAPI,
      requestOptions
    );

    if (requestApi.serverError) {
      //search in mongoDB
      //TO DO: test function
      return JSON.stringify({
        Error: `1C API с url ${apiProvider.api_url} не доступен (1С сервер не работает)`,
        api_name: apiProvider.collection,
        apiURL: apiProvider.api_url,
      });
    }

    if (requestApi.myFlag) {
      switch (req.body.operation) {
        case "update":
          //UPSERT
          if (!req.body.update_filter)
            return res.status(200).send(
              JSON.stringify({
                Failure: `не указан фильтр для update https://docs.mongodb.com/manual/reference/method/db.collection.updateMany/`
              })
            );
            
          //default false
          let upsertValue = (req.body.upsert) ? true: false;
          let updateToApiReserve = await apiReserve.updateMany(req.body.update_filter, requestApi, {upsert: upsertValue });
          if (updateToApiReserve.insertedCount > 0) {
            return res.status(200).send(
              JSON.stringify({
                Success: `успешно ОБНОВЛЕНЫ записи в количестве ${updateToApiReserve.modifiedCount}`,
                matchedCount: updateToApiReserve.matchedCount,
                apiName: apiProvider.collection,
                apiURL: apiProvider.api_url,
              })
            );
          }
          break;

        default:
          //insert all data
          let insertToApiReserve = await apiReserve.insert(requestApi);
          if (insertToApiReserve.insertedCount > 0) {
            return res.status(200).send(
              JSON.stringify({
                Success: `успешно ДОБАВЛЕНЫ новые записи в количестве ${insertToApiReserve.insertedCount}`,
                apiName: apiProvider.collection,
                apiURL: apiProvider.api_url,
              })
            );
          }
          break;
      }
    }
  }
}

