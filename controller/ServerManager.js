import fetch from "@adobe/node-fetch-retry";

export class ApiRequestManager {
  constructor(url, mode, options, ringOpts) {
    this.makeApiCall = this.makeApiCall.bind(this);
    this.url = url;
    this.mode = mode;
    this.options = options;
    this.ringOpts = ringOpts;

    this.ringOpts.retryMaxDuration = this.ringOpts.retryMaxDuration * 60000; //минуты
    this.ringOpts.retryInitialDelay = this.ringOpts.retryInitialDelay * 1000; //секунды
    this.ringOpts.retryBackoff = 1.0;
    this.ringOpts.retryOnHttpResponse = function (response) {
      if (response.status >= 500 || response.status >= 400) {
        // retry on all 5xx and all 4xx errors
        return true;
      }
    };
  }

  async makeApiCall() {
    return new Promise((resolve, reject) => {
      const fetchRes = fetch(this.url, {
        ...this.options,
        retryOptions: this.ringOpts,
      })
        .then((res) => {
          if (res.ok) return res.text();
          else {
            throw new Error(res.json());
          }
        })
        .then((res) => {
          if (this.mode == "store") {
            res = res.trim();
            resolve({ ...JSON.parse(res), myFlag: true });
          } else {
            resolve(res);
          }
        })
        .catch((error) => {
          resolve({ serverError: error });
        });
    });
  }
}
