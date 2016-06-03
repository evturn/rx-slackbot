import * as Rx from 'rxjs'
import request from 'request'
import qs from 'querystring'

const sendRequest = url => {
  return Rx.Observable.create(x => {
    request(url, (error, response, body) => {
      if (error) {
        x.error(error)
      } else if (!error && response.statusCode === 200) {
        x.next(JSON.parse(body))
      }

      x.complete()
    })
  })
}

const makeRequest = ({ query, ...params }) => {
  return sendRequest(`https://slack.com/api/${query}?${qs.stringify(params)}`)
}

function send(query) {
  return x => {
    return makeRequest({
      ...x,
      query
    })
  }
}

export default send