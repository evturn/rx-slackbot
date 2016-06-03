const bot = {
  token: process.env.MACLONEY_TOKEN,
  name: 'Macloney Culkin',
  username: 'macloneyculkin',
  real_name: 'Macloney Culkin',
  icon_url: 'https://avatars.slack-edge.com/2016-06-02/47795154770_c11d4edd14d1e7f1e2ae_512.png'
}

const actions = [
  {
    keyword: '<@U1DNZ07EK>',
    reply: `Please do not talk to me.`
  },{
    keyword: 'lol',
    reply: 'lol',
  },{
    keyword: 'haha',
    reply: 'everyone just relax'
  },{
    keyword: 'giphy',
    reply: `This is my father: :coffer:`
  },{
    keyword: 'thanks',
    reply: 'you can thank me'
  },{
    keyword: 'cool',
    reply: `i guess that's interesting`
  }, {
    keyword: 'maclone',
    reply: `Hi, I'm Macloney. Let's Maclone it up and Maclone it out.`
  }
]

export {
  bot,
  actions
}