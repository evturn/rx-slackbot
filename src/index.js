import express from 'express'
import * as Rx from 'rxjs'
import ws from 'ws'
import send from './utils'
import {
  bot,
  actions
} from './data'

const app = express()

const bot$ = Rx.Observable.of(bot)
const actions$ = Rx.Observable.from(actions)

const start$ = bot$
  .flatMap(send('rtm.start'))
  .map(x => new ws(x.url))
  .flatMap(onConnect)

const typing$ = start$
  .filter(x => x.type === 'user_typing')

const reactions$ = start$
  .flatMap(filterIncomingMessages)
  .flatMap(createResponse)
  .delay(400)
  .flatMap(send('chat.postMessage'))

Rx.Observable.merge(reactions$, typing$)
  .subscribe(
    x => console.log('Next:', x),
    e => console.log('Error:', e),
    _ => console.log('Complete.')
  )

function onConnect(socket) {
  return Rx.Observable.merge(
    Rx.Observable.fromEvent(socket, 'start'),
    Rx.Observable.fromEvent(socket, 'close'),
    Rx.Observable.fromEvent(socket, 'message'),
    Rx.Observable.fromEvent(socket, 'user_typing')
  )
  .map(x => JSON.parse(x))
}

function filterIncomingMessages(evt) {
  return actions$
    .filter(action => (
      evt.type === 'message' &&
      evt.text !== undefined &&
      evt.subtype !== 'bot_message' &&
      evt.text.includes(action.keyword)
    ))
    .map(action => ({ ...evt, reply: action.reply }))
}

function createResponse(data) {
  return bot$
    .map(x => ({
      channel: data.channel,
      text: data.reply,
      unfurl_links: true,
      ...x
    }))
}

app.listen(3000)
module.exports = app