let students=[];

function addStudent(){
 const input=document.getElementById("studentName");
 const name=input.value.trim();
 if(name===""){
   alert("Enter student name");
   return;
 }
 students.push(name);     
 input.value="";
 displayStudents();
}

function displayStudents(){
 const list=document.getElementById("studentList");
 list.innerHTML="";
 students.forEach((student,index)=>{
   list.innerHTML+=
`  <li>
      ${index+1}. ${student}
      <button class="delete" onclick="deleteStudent(${index})">Delete</button>
   </li>`;
 });
 document.getElementById("count").textContent=students.length;
}

function deleteStudent(index){
 students.splice(index,1); 
 displayStudents();
}


let name='Bhavesh';
console.log(`name is ${name}`);