import boom from "boom";
import fetch from "node-fetch";
import * as Client from "../models/Client.js";

const API_1C_BONUS_CLIENT_URL = "http://62.168.226.38:7599/testbd/hs/bonus/";
global.Headers = fetch.Headers;

export class BonusController {

  constructor() {

    this.retryCodes = [408, 500, 502, 503, 504, 522, 524];
    this.verifyClient = this.verifyClient.bind(this);
    this.myHeaders = new Headers();
    this.myHeaders.append("Authorization", "Basic dHJhY2s6NTZxdHA3");
    this.requestOptions = {
      method: 'GET',
      headers: this.myHeaders,
      redirect: 'follow'
    };

  }

  //рекурсивная проверка статуса сервера
  async checkClientVerification(req, retries = 3, backoff = 300) {
    return fetch(`${API_1C_BONUS_CLIENT_URL}getclient?phone=${req.params.phone}&barcode=${req.params.cardNumber}`, this.requestOptions) 
    .then(response => { 
      if (retries > 0 && this.retryCodes.includes(response.status)) {
        setTimeout(() => { return this.checkForServerDown(req, retries - 1, backoff * 2)}, backoff);
      } 
      if (response.ok)  {
        console.log(`сервер ответил ОК`);
        return response.text();
      }
    })
    .then(text => {return text;})
    .catch(error => boom.boomify(error))
  }

  //метод  для проверки клиента в оффлайн базе, если 1С не доступна
  async verifyClient(req, reply) {
    console.log(req.params);
    //запрос к 1С
    let clientVerificationData = await this.checkClientVerification(req);
    if (!clientVerificationData) {
      return 'Сервер 1С не доступен'

      /*TO DO: посмотреть наличие данной записи в схеме mongoDB
      //если клиент есть, то вернуть 
      {
        "Error": "Бонусная карта не найдена"
      }
      */
    } else return clientVerificationData;

  }

  async fetchAllClients(req, reply) {
    let clients = await fetch(`${API_1C_BONUS_CLIENT_URL}`);
  }
}
