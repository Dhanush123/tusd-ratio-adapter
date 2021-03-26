const { Requester, Validator } = require('@chainlink/external-adapter')

const createRequest = (input, callback) => {
  // The Validator helps you validate the Chainlink request data
  console.log("ADAPTER input!!!",input);
  const validator = new Validator(callback, input, {})
  const jobRunID = validator.validated.id
  const url = `https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD`

  // This is where you would add method and headers
  // you can add method like GET or POST and add it to the config
  // The default is GET requests
  // method = 'get' 
  // headers = 'headers.....'
  const config = {
    url
  }

  // The Requester allows API calls be retry in case of timeout
  // or connection failure
  Requester.request(config)
    .then(response => {
      // It's common practice to store the desired value at the top-level
      // result key. This allows different adapters to be compatible with
      // one another.
      let totalTrust =  Requester.validateResultNumber(response, ['data','responseData','totalTrust']);
      let totalToken =  Requester.validateResultNumber(response, ['data','responseData','totalToken']);
      let tokenTrustRatio = Math.round((totalToken/totalTrust + Number.EPSILON) * 10000) / 10000;
      response.data.result = tokenTrustRatio;
      callback(response.status, Requester.success(jobRunID, response))
    })
    .catch(error => {
      callback(500, Requester.errored(jobRunID, error))
    })
}

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = (req, res) => {
  createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data)
  })
}

// This is a wrapper to allow the function to work with
// AWS Lambda
exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data)
  })
}

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = (event, context, callback) => {
  createRequest(JSON.parse(event.body), (statusCode, data) => {
    callback(null, {
      statusCode: statusCode,
      body: JSON.stringify(data),
      isBase64Encoded: false
    })
  })
}

// This allows the function to be exported for testing
// or for running in express
module.exports.createRequest = createRequest
