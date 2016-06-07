import mongoose from 'mongoose'
import Upload from './models/Upload'

mongoose.connect('mongodb://127.0.0.1/backpack')
mongoose.connection.on('error', console.error.bind(console, 'Connection error:'))
mongoose.connection.once('open', _ => console.log('DB Connected'))

export {
  Upload
}