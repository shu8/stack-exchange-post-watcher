(function () {
  window.SEPostWatcher = window.SEPostWatcher || {};

  SEPostWatcher.API = {
    get: async function (endpoint, params) {
      return new Promise((resolve, reject) => {
        console.log('Making API request', endpoint, params);
        let paramsString = '';

        // Add access token and API key for all requests
        params.key = SEPostWatcher.API_KEY;
        params.accessToken = SEPostWatcher.accessToken;

        // Endpoints have filters defined seperately in constants.js
        if (Object.keys(SEPostWatcher.API_FILTERS_FOR_ENDPOINTS).includes(endpoint)) {
          params.filter = SEPostWatcher.API_FILTERS_FOR_ENDPOINTS[endpoint];
        }

        // If the endpoint has {ids} in it then replace with the actual IDs which should be provided
        if (params.ids && endpoint.match(/{ids}/)) {
          endpoint = endpoint.replace(/{ids}/, params.ids.join(';'));
          delete params.ids;
        }

        // Make a query parameter string for each of the parameters in the params object
        // The '&' that will be present at the end is ignored so does not need to be removed
        Object.keys(params).forEach(param => paramsString += `${param}=${params[param]}&`);

        const request = new XMLHttpRequest();
        request.open('GET', `${SEPostWatcher.API_BASE_URL}/${endpoint}?${paramsString}`, true);
        request.onload = function () {
          if (request.status >= 200 && request.status < 400) {
            const data = JSON.parse(request.responseText);
            console.log('Received data from API', data);
            resolve(data.items);
          } else {
            reject('Error');
          }
        };
        request.onerror = function (error) { reject(error); };
        request.send();
      });
    },
  };
})();
