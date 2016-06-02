const express = require('express')
const request = require('request')
const Rx = require('rxjs')
const ws = require('ws')
const qs = require('querystring')

const app = express()

const route = 'https://slack.com/api/'
const macloney = {
  token: process.env.MACLONEY_TOKEN,
  name: 'Macloney Culkin',
  username: 'macloneyculkin',
  real_name: 'Macloney Culkin',
  icon_url: 'https://avatars.slack-edge.com/2016-06-02/47795154770_c11d4edd14d1e7f1e2ae_512.png'
}

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

const startRequest = bot => (
  sendRequest(`${route}rtm.start?${qs.stringify(bot)}`)
)
const postRequest = bot => (
  sendRequest(`${route}chat.postMessage?${qs.stringify(bot)}`)
)

const bot$ = Rx.Observable.of(macloney)
const socket$ = bot$
  .flatMap(startRequest)
  .map(x => new ws(x.url))
  .map(socket => (
    Rx.Observable.combineLatest(
      Rx.Observable.fromEvent(socket, 'open'),
      Rx.Observable.fromEvent(socket, 'close'),
      Rx.Observable.fromEvent(socket, 'message')
    )
  ))

const postMessage$ = bot$
  .map(x => ({
    channel: '#general',
    text: `Please stop. Here is a photo of me. I hope you enjoy. ${x.icon_url}`,
    token: x.token,
    username: x.username,
    icon_url: x.icon_url,
    unfurl_links: true
  }))
  .flatMap(postRequest)


Rx.Observable.combineLatest(socket$, postMessage$)
  .subscribe(
    x => console.log('Next:', x),
    e => console.log('Error:', e),
    _ => console.log('Complete.')
  )

app.listen(3000)