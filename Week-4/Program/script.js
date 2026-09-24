const users=[
{username:'admin',password:'admin123'},
{username:'surya',password:'surya123'},
{username:'students',password:'placement'},
{username:'cseaiml',password:'welcome123'}
];
document.getElementById('loginForm').addEventListener('submit',e=>{
e.preventDefault();
const u=username.value.trim();
const p=password.value.trim();
if(users.find(x=>x.username===u && x.password===p)){
localStorage.setItem('user',u);
location.href='success.html';
}else{
error.innerText='Invalid Username or Password';
}
});