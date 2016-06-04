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

/*
  Start stream
*/
const stream$ = bot$
  .flatMap(send('rtm.start'))
  .map(x => new ws(x.url))
  .flatMap(onConnect)

/*
  File uploads
*/
const file$ = stream$
  .filter(x => x.subtype === 'file_share')
  .map(respondToFileShare)
  .flatMap(sendResponse)


/*
  Messages w/ attachments
*/
const attachment$ = stream$
  .filter(x => (
    x.type === 'message' &&
    x.message &&
    x.message.attachments
  ))
  .map(respondToAttachment)
  .flatMap(sendResponse)


/*
  Messages w/ keyword
*/
const message$ = stream$
  .flatMap(respondToKeyword)
  .flatMap(sendResponse)


/*
  Debugger
*/
const all$ = stream$
  .do(x => console.log(x))


/*
  Subscription
*/
Rx.Observable.merge(
  file$,
  attachment$,
  all$,
  message$
)
.subscribe(
  x => console.log(x),
  e => console.log('Error:', e),
  _ => console.log('Complete.')
)

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

function sendResponse(data) {
  return bot$
    .map(x => ({
      channel: data.channel,
      text: data.reply,
      unfurl_links: true,
      ...x
    }))
    .delay(200)
    .flatMap(send('chat.postMessage'))
}

function respondToKeyword(evt) {
  return actions$
    .filter(action => (
      evt.type === 'message' &&
      evt.text !== undefined &&
      evt.subtype !== 'bot_message' &&
      evt.text.includes(action.keyword)
    ))
    .map(action => ({
      ...evt, reply: action.reply
    }))
}

function respondToFileShare(x) {
  return {
    ...x,
    reply: `Looks like a ${x.file.pretty_type} file with a mimetype of ${x.file.mimetype}.`
  }
}

function respondToAttachment(x) {
  return {
    ...x,
    reply: `I get all my stuff from ${x.message.attachments[0].service_name} too.`
  }
}

app.listen(2000)
module.exports = app
