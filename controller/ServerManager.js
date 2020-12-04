import fetch from "node-fetch-retry";

export class ApiRequestManager {
  constructor() {
    
  }

  //CUSTOM FUNCTION NOT FOR EVERYTHING
  //api info fetcher
  //checks is a server available then fetches data
  //RETURNS AN OBJECT!!!
  async checkAPIForUp(link, requestOptions) {
    return new Promise((resolve, reject) => {
      const fetchRes = fetch(link, {...requestOptions, retry:3, pause: 1500}).then(res =>
        {
         if (res.ok)
           return res.text();
       })
       .then(res => {
         res = res.trim();
         resolve({ ...JSON.parse(res), myFlag:true });
       })
       .catch (error => {
        resolve({serverError: error});
       })
    })
  }
}

