import * as Rx from 'rxjs'
import request from 'request'
import qs from 'querystring'

const sendRequest = url => (
  Rx.Observable.create(x => {
    request(url, (error, response, body) => {
      if (error) {
        x.error(error)
      } else if (!error && response.statusCode === 200) {
        x.next(JSON.parse(body))
      }

      x.complete()
    })
  })
)

const makeRequest = ({ query, ...params }) => (
  sendRequest(`https://slack.com/api/${query}?${qs.stringify(params)}`)
)

const send = query => (
  params => makeRequest({ ...params, query })
)

export default send
