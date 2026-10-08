import { useState } from "react";

function App() {

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    department: ""
  });

const handleChange=(e)=>{
         setFormData({
            ...formData,
              [e.target.name]:e.target.value
            })
}
const [submittedData,setSubmittedData] =useState(null);
 const handleSubmit = (e)=>{
        e.preventDefault();
        setSubmittedData(formData);
       }
     
  return (
    <div>
      <h1>College Event Registration</h1>

      <p>Register for upcoming college events</p>
<br/><br/>
      <form onSubmit={handleSubmit}>

        <label>Full Name:</label>
        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleChange}
        />

        <br /><br />

        <label>Email:</label>
        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
        />

        <br /><br />

        <label>Phone Number:</label>
        <input
          type="tel"
          name="phone"
          placeholder="Enter your phone number"
          value={formData.phone}
          onChange={handleChange}
        />

        <br /><br />

        <label>Department:</label>
        <select
          name="department"
          value={formData.department}
          onChange={handleChange}
        >
          <option value="">Select Department</option>
          <option value="CSE">CSE</option>
          <option value="CSM">CSM</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
          <option value="IT">IT</option>
        </select>

        <br /><br />

        <button type="submit">Register</button>
        {submittedData  && <div><br/><p>Registered Successfully
</p><br/><p> Name : {submittedData.name}</p><br/><p> Email : {submittedData.email}</p><br/><p> Phone : {submittedData.phone}</p><br/><p> Department : {submittedData.department}</p>
</div>}


      </form>
    </div>
  );
}

export default App;