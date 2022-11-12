import React from 'react'
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div style={{"fontSize": "x-large"}}>
        <h1>Landing</h1>
        <Link to="/login">Login</Link><br></br>
        <Link to="/register">Register</Link>
    </div>
  )
}

export default Landing