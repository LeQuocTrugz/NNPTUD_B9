let mongoose = require('mongoose');

let messageSchema = mongoose.Schema({
  from: {
    type: mongoose.Types.ObjectId,
    ref: 'user',
    required: true
  },
  to: {
    type: mongoose.Types.ObjectId,
    ref: 'user',
    required: true
  },
  messageContent: {
    type: {
      type: String,
      enum: ['file', 'text'],
      required: true
    },
    text: {
      type: String,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('message', messageSchema);