import express from "express";
import fs from "fs";
import cookieParser from 'cookie-parser';
import Users from './Users.mjs';
import {WebSocketServer}  from 'ws';
import {createServer} from 'http';
import MessageHandlers from './MessageHandlers.mjs'


const secret = 'qwerty';
const textConfig = fs.readFileSync('./config.json');
const config = JSON.parse(textConfig)
const port = config.port; 
const users = new Users();

const app = express();
const server = createServer(app)

const webSocketServer = new WebSocketServer({ server });
const messageHandler = new MessageHandlers(webSocketServer) 

// подключаем cookie
app.use(cookieParser(secret));
// подключаем urlencoded
app.use(express.urlencoded({ extended: true }));
// Указываем шаблонизатор
app.set('view engine', 'ejs');
// Указываем папку с js, css и картинками
app.use(express.static('public'))

// основной роут
app.route('/').get(async (req, res)=>{
  const id = req.cookies.id
  const name = req.cookies.name
  const surname = req.cookies.surname
  if(!users.checkUser(id,name,surname)){
    res.render('index')
  } 
  else {
    // res.clearCookie('id'); res.clearCookie('name'); res.clearCookie('surname')
    res.render('user', {name: `${name} ${surname}`,serverPort: port})
  }
  
})
// роут для определение пользователя
app.route('/setUserName').post(async (req, res)=>{
  const name = req.body.name
  const surname = req.body.surname
  const newUser = users.addNewUser(name,surname); 
  res.cookie('name', newUser.name)
  res.cookie('surname', newUser.surname)
  res.cookie('id', newUser.id)
  res.redirect('/')
})
// роут для админа
app.route('/admin').get(async (req, res)=>{
  const users = []
  res.render('admin', {users, serverPort:port})
})

server.listen(port, ()=>{
    console.log(`Http server listens pot ${port}`);
})
