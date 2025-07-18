const userMain = document.querySelector('#welcomeUser')
const adminMain = document.querySelector('#welcomeAdmin')
const currentUser = getCookie(['name','surname','id'])
const socket = new WebSocket('ws://localhost:' + port); // port берётся из config.json

// извлечь document.cookie и использовать в websocket сообщениях
function getCookie(filterNames) {
  return document.cookie.split('; ').filter(c=>{
	const [name, value] = c.split('=')
	return Array.isArray(filterNames)? filterNames.some(n=>n==name): true
  }).reduce((acc, item) => {
    const [name, value] = item.split('=')
    acc[name] = decodeURIComponent(value)
    return acc
  }, {})
}

// страница user
if(userMain){
  socket.onmessage = (event) => {
      const chat = document.querySelector('.chat');
      const response = JSON.parse(event.data)
      if(response.type=='message')
        chat.innerHTML += (response.message + '<br>')
  };
  socket.onopen = () => {
    const name = currentUser.name; 
    const surname = currentUser.surname;
    const id = currentUser.id; 
    const message = {
      type: 'first connect', 
      from: id, 
      to: 'first connect', 
      message:{name:name??null, surname:surname??null, id:id??null}
    }
    socket.send(JSON.stringify(message));
  }
}

// страница admin
if(adminMain){
  const adminId = 0;
  socket.onopen = () => {
    const message = {
      type: 'first connect', 
      from: adminId,
      to: 'first connect', 
      message: {name: 'admin', surname:'', id:adminId }
    }
    socket.send(JSON.stringify(message));   
  }

  const adminForm = document.querySelector('#adminForm')
  adminForm.addEventListener('submit',(e)=>{ e.preventDefault();})
  
  function sendMessage(event) {
    const target = event.target
    const messageBox = target.parentNode.querySelector('.userMessageBox')
    const message = messageBox.value;
    const userId = target.dataset.userId
    
    socket.send(JSON.stringify({type:'message', from: adminId, to: userId, message }));
    
    const sentMessage = target.parentNode.querySelector('.sentMessage')
    sentMessage.innerHTML = message + '<br>' + sentMessage.innerHTML;
    messageBox.value=''
  }

  const buttons = adminMain.querySelectorAll('.userMessageBtn')
  for(let i=0; i<buttons.length; i++){
      buttons[i].addEventListener('click', sendMessage)
  }
  
  
  socket.onmessage = (event) => {
    // обработка сообщений об отключении и подключении пользователей  
    const response = JSON.parse(event.data)
    
    const currentUserIds = []
    const activeUsersBox = adminForm.querySelector('#activeUsers')
    activeUsersBox.querySelectorAll('#activeUsers .userMessageBtn').forEach(el=>{
      currentUserIds.push(el.dataset.userId)
    })

    if(response.type=='update user list'){
      const newUserList = response.message.filter(m=>m.id!=adminId) // [{name, surname, id}]
      const newUsers = newUserList.filter(u=>!currentUserIds.some(uid=>uid==u.id))
      const removedUserIds = currentUserIds.filter(uid=>!newUserList.some(u=>u.id==uid))

      newUsers.forEach(nu=>{
        const userItem = createUserItemElement(nu)
        userItem.querySelector('.userMessageBtn').addEventListener('click',sendMessage)
        activeUsersBox.appendChild(userItem)
      })
      removedUserIds.forEach(rId=>{
        // селектор атрибутов по атрибуту data-user-id=ID_отключившегося_пользователя
        const removeItem = activeUsersBox.querySelector(`button[data-user-id="${rId}"]`)
        activeUsersBox.removeChild(removeItem.parentElement)
      })
    }

  };
}

/**
 * 
 * @param {User} user объект с полями {id, name, surname}
 * @returns {HTMLLIElement} элемент списка пользователей
 */
function createUserItemElement(user){
  const li = document.createElement('li')
  li.classList.add("activeUser")

  const h4 = document.createElement('h4')
  h4.classList.add("activeUserName")
  h4.textContent = `${user.name} ${user.surname}`
  li.appendChild(h4)

  const input = document.createElement('input')
  input.setAttribute('type', 'text')
  input.setAttribute('id', user.id)
  input.classList.add("userMessageBox")
  li.appendChild(input)

  const button = document.createElement('button')
  button.classList.add('userMessageBtn')
  button.textContent = "Отправить"
  button.dataset.userId = user.id
  li.appendChild(button)

  const p = document.createElement('p')
  p.classList.add('sentMessage')
  li.appendChild(p)

  return li
}