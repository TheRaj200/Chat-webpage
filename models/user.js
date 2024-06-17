const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://raj12345chaurasiya:PBrOlOBQkUS5Rhpf@zeus.zkdwgq4.mongodb.net/?retryWrites=true&w=majority&appName=zeus";
mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB Atlas');
}).catch(err => {
    console.error('Error connecting to MongoDB Atlas:', err.message);
});
  const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    url:String,
    posts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'post'
    }],
    chat: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'chat'
    }]
  });
  
  module.exports = mongoose.model('user', userSchema);