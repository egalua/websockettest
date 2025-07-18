export default class MessageHandlers{
  constructor(socket){
    this.socket = socket
    this.clients = []
    this._connection = this._connection.bind(this)

    this._init();
  }
  _connection(ws){
    ws.on('error', console.error);
    ws.on('message', this._message.bind(this, ws));
    ws.on('close', this._close.bind(this, ws));
    // ws.send('something')
  }
  _message(ws, data){
    const dataObj = JSON.parse(data);

    if(dataObj.type=='first connect'){
      // добавить нового клиента
      this.clients.push({ws, clientId: dataObj.from, userData: dataObj.message});      
      // отправить всем новый список подключенных с типом 'user list'
      const newClientsList = this.clients.map(c=>c.userData)
      this.clients.forEach(c=>{
        c.ws.send(JSON.stringify({
          type: 'update user list',
          from: '',
          to: c.clientId,
          message: newClientsList
        }))
      })

    }
    if(dataObj.type=='message'){
      const client = this.clients.find(c=>c.clientId==dataObj.to)
      client?.ws.send(JSON.stringify(dataObj)) 
    }
    
  }
  _close(ws, data){
    const removedClient = this.clients.find(c=>c.ws==ws)
    const removedClientId = removedClient.clientId
    this.clients = this.clients.filter(c=>c.clientId!=removedClientId)
    const newClients = this.clients.map(c=>c.userData)
    this.clients.forEach(c=>{
      this._sendMessage({
        type: 'update user list', 
        from: '', 
        to: c.clientId, 
        message: newClients
      })
    })
    
  }
  
  _init(){
    this.socket.on('connection', this._connection)
  }

  _sendMessage(data){
    // data == {type,from,to,message}
    const client = this.clients.find(c=>c.clientId==data.to)
    client.ws.send(JSON.stringify(data))
  }
  
}