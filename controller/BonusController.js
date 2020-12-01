import boom from "boom";
import fetch from "node-fetch";
import Boom from "boom";
import {ApiRequestManager} from "./ServerManager.js"


const API_1C_BONUS_CLIENT_URL = "http://62.168.226.38:7599/testbd/hs/bonus/";
const MAIN_DATABASE_URL =
  "https://5fabd04903a60500167e724e.mockapi.io/testbd/hs/bonus/";

global.Headers = fetch.Headers;

export class BonusController {
  constructor(mongo) {
    this.retryCodes = [408, 500, 502, 503, 504, 522, 524];
    this.apiRequestManager = new ApiRequestManager();
    this.myHeaders = new Headers();
    this.myHeaders.append("Authorization", "Basic dHJhY2s6NTZxdHA3");
    this.mongo = mongo;
    this.requestOptions = {
      method: "GET",
      headers: this.myHeaders,
      redirect: "follow"
    };
    this.verifyClient = this.verifyClient.bind(this);
    this.tokenOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: {
        name: 'retard',
        password: 'testpassword'
      }
    };

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

  //регистрация API
  async factoryAPI (req, res) {
    //если есть параметер с коллекцией
    if (req.body.collection)
    {
   
      //если такая коллекия еще есть 
      console.log( await this.mongoNative.db('reapid_1c_requests').listCollections().toArray());
      return;
      if (await this.mongoNative.db('reapid_1c_requests').listCollections().includes(req.body.collection)) {
        return res.status(200).send({message: "такой API уже подключен"});
      }

     let _fieldsAndValues;

      try  {
       _fieldsAndValues = {
          api_url: req.body.apiStructure.api_url,
          method: req.body.apiStructure.method,
          collection: req.body.collection,
          headers: req.body.apiStructure.headers,
          bodyparams: req.body.apiStructure.bodyparams,
          urlparams: req.body.apiStructure.urlparams,
          response_structure: req.body.apiStructure.response_structure
        }
      } catch (error) {
        return Boom.boomify(error);
      }

      //как получить своего хоста
      const urlToken = 'localhost:3000/auth/login';
      const urlInsertApi = 'localhost:3000/app/crud?collection=apis';
      const createApiReserve = `localhost:3000/app/table_factory?collection=${api_url}`;
      //получаем токен
      let tokenReq = await fetch(urlToken, this.tokenOptions);

      
      
      let insertRequestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-access-token': tokenReq.token
        },
        body: {
          changes: {fieldsAndValues: _fieldsAndValues} 
        }
      };

      let optionsCreateTable = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'x-access-token': tokenReq.token
        },
        body: {
          options:  _response_structure,
          operation: "create_table"
        }
      }

      let makeApiTable = await fetch(createApiReserve, optionsCreateTable);
      if (makeApiTable.Success) {
        let insertApiRes = await fetch(urlInsertApi, insertRequestOptions);
        return res.status(200).send({...makeApiTable, ...insertApiRes, Success: `API для 1C c относительным URL </${_fieldsAndValues.api_url}> зарегестрирован`})
      }
      if (makeApiTable.status === 400) {
        return makeApiTable;
      }
    }
  }

  async apiClient (req, res) {
    if (!req.query.api_name) return Boom.badRequest("укажите api_name");

    let apiProvider = await this.mongo
      .db("reapid_1c_requests")
      .collection("apies")
      .find({ api_url: api_name });

    // проверки url и body запросов
    try {
      //проверка на целостность данных body к запросу
      if (req.body.bodyparams !== "") {
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

      //проверка на целостность данных url к запросу
      if (req.body.urlparams !== "") {
        let counterKey = 0;
        for (let key of req.body.urlparams) {
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

    //формирование запроса
    let requestOptions = {
      method: apiProvider.method, //метод POST, GET, ...
      headers: this.myHeaders, //авторзация в API
      redirect: "follow", //редирект
      body: req.body,
    };

    //формирование ссылки на запрос
    let urlAPI = `${apiProvider.api_url}`;
    if (req.body.url_param_values) {
      let index = 0;
      urlAPI = `${apiProvider.api_url}?`;
      for (let param of apiProvider.urlparams) {
        urlAPI += `${param}=${req.body.urlparams[index]}`;
        index++;
      }
    }

    console.log(urlAPI);

    try {
      let requestApi = await this.apiRequestManager(
        req,
        res,
        urlAPI,
        requestOptions
      );
      if (requestApi.Error) {
        return this.searchInMongoDB(req, res);
      }
      let apiReserve = await this.mongo
        .db("reapid_1c_requests")
        .collection(apiProvider.collection);
      let insertToApiReserve = await apiReserve.insert(JSON.parse(requestApi));

      if (insertToApiReserve.nInserted > 0) {
        return res.status(200).send(requestApi);
      }
    } catch (error) {
      return Boom.boomify(error);
    }
  }





}

