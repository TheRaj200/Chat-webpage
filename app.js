const express = require('express');
const app = express();
const userModel = require("./models/user");
const postModel = require("./models/post");
const chatModel = require('./models/chat');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/profile', isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email }).populate('posts');
  res.render('profile', { user });
});

app.get('/global', isLoggedIn, async (req, res) => {
  let posts = await postModel.find().populate('user');
  res.render('global', { posts, user: req.user });
});

app.get('/chat', isLoggedIn, async (req, res) => {
  let chat = await chatModel.find().populate('user'); // Use chatModel
  res.render('chat', { chat, user: req.user });
});

app.get('/like/:id', isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(post.likes.indexOf(req.user.userid), 1);
  }
  await post.save();
  res.redirect(req.get('referer'));
});

app.get('/edit/:id', isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id });
  res.render('edit', { post });
});

app.post('/update/:id', isLoggedIn, async (req, res) => {
  await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content });
  res.redirect('/profile');
});

app.post('/post', isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let post = await postModel.create({
    user: user._id,
    content
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect('/profile');
});

app.post('/chat', isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let chat = await chatModel.create({
    user: user._id,
    chat: content
  });
  user.chat.push(chat._id); // Add chat to user's chat array
  await user.save();
  res.redirect('/chat');
});

app.get('/delete/:id', isLoggedIn, async (req, res) => {
  await postModel.findOneAndDelete({ _id: req.params.id });
  res.redirect('/global');
});
app.get('/chat-delete/:id', isLoggedIn, async (req, res) => {
  await chatModel.findOneAndDelete({ _id: req.params.id });
  res.redirect('/chat');
});

app.post('/register', async (req, res) => {
  let { email, password, username, name, age,url } = req.body;
  let user = await userModel.findOne({ email });
  if (user) return res.status(500).send('User already registered');
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        username,
        email,
        age,
        name,
        url,
        password: hash
      });
      let token = jwt.sign({ email: email, userid: user._id }, 'random');
      res.cookie('token', token);
      res.redirect('profile');
    });
  });
});
app.post('/login', async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.status(500).send('Something is wrong');
  bcrypt.compare(password, user.password, function (err, result) {
    if (result) {
      let token = jwt.sign({ email: email, userid: user._id }, 'random');
      res.cookie('token', token);
      res.status(200).redirect('profile');
    } else {
      res.redirect('/login');
    }
  });
});

app.get('/logout', (req, res) => {
  res.cookie('token', '');
  res.redirect('/');
});

function isLoggedIn(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.redirect('/login');
  }
  try {
    let data = jwt.verify(token, 'random');
    req.user = data;
    next();
  } catch (err) {
    res.send('Invalid token');
  }
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});