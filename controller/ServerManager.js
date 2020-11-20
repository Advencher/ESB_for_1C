export class ApiRequestManager {

  constructor() {}

  //api info fetcher
  async checkAPIForUp(
    req,
    res,
    next,
    retries = 3,
    backoff = 300,
    link,
    requestOptions
  ) {
    return fetch(link, requestOptions)
      .then((response) => {
        if (retries > 0 && this.retryCodes.includes(response.status)) {
          setTimeout(() => {
            return this.checkAPIForUp(req, retries - 1, backoff * 2);
          }, backoff);
        }
        if (response.ok) {
          console.log(`API server is up and running`);
          console.log(response);
          req.fromApi = response;
          next();
        }
      })
      .catch((error) => {
        req.errorFromApi = boom.boomify(error);
        next();
      });
  }
}