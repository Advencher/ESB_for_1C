import Boom from "boom";

export class ApiRequestManager {

  constructor() {
    this.retryCodes = [408, 500, 502, 503, 504, 522, 524];
  }

  //api info fetcher
  //checks is a server available then fetches data 
  async checkAPIForUp(
    req,
    res,
    link,
    requestOptions,
    retries = 3,
    backoff = 300
  ) {
    return fetch(link, requestOptions)
      .then((response) => {
        if (retries > 0 && this.retryCodes.includes(response.status)) {
          setTimeout(() => {
            return this.checkAPIForUp(req, retries - 1, backoff * 2);
          }, backoff);
        }
        if (response.ok) {
          return response;
        }
      })
      .catch((error) => {
        return Boom.boomify(error);
      });
  }
}
