import fs from "fs";

export default class Users{
  constructor(){
    this.usersFilename = './users.json'
    this.userList = fs.readFileSync(this.usersFilename);
    this.users = JSON.parse(this.userList)
  }
  
addNewUser(name, surname){
  const users = this.users
  const userIDs = users.map(u=>parseInt(u.id)).filter(id=>!isNaN(id))
    
  const id = userIDs.length? (Math.max(...userIDs) + 1): 1
  const user = {id, name, surname}
  users.push(user)
  fs.writeFileSync(this.usersFilename, JSON.stringify(users))
  return user
}
checkUser(id, name, surname){
  const users = this.users
  return !Array.isArray(users)
    ? false
    : users.some(u=>u.id==id && u.name==name && u.surname==surname)
}
}