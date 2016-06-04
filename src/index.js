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

const stream$ = bot$
  .flatMap(send('rtm.start'))
  .map(x => new ws(x.url))
  .flatMap(onConnect)

function onConnect(socket) {
  return Rx.Observable.merge(
    Rx.Observable.fromEvent(socket, 'hello'),
    Rx.Observable.fromEvent(socket, 'message'),
    Rx.Observable.fromEvent(socket, 'user_typing'),
    Rx.Observable.fromEvent(socket, 'file_shared'),
    Rx.Observable.fromEvent(socket, 'file_created'),
    Rx.Observable.fromEvent(socket, 'file_public'),
    Rx.Observable.fromEvent(socket, 'file_private'),
    Rx.Observable.fromEvent(socket, 'file_deleted'),
    Rx.Observable.fromEvent(socket, 'file_change')
  )
  .map(x => JSON.parse(x))
}


const file$ = stream$
  .filter(x => x.subtype === 'file_share')
  .map(x => ({ ...x, reply: `Looks like a ${x.file.pretty_type} file with a mimetype of ${x.file.mimetype}.`}))
  .flatMap(createResponse)
  .delay(300)
  .flatMap(send('chat.postMessage'))

const message$ = stream$
  .flatMap(filterIncomingMessages)
  .flatMap(createResponse)
  .delay(300)
  .flatMap(send('chat.postMessage'))

const all$ = stream$
  .do(x => console.log(x))


Rx.Observable.merge(
  file$,
  all$,
  message$
)
.subscribe(
  x => console.log(x),
  e => console.log('Error:', e),
  _ => console.log('Complete.')
)


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
