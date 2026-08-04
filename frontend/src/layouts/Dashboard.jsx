import React from 'react';
import { Outlet } from 'react-router-dom';
import "./Dashboard.css";
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';


const Dashboard = () => {
  

  return (

    <div className="dashboard">
        <Sidebar />

    <div className="main">
         <Header />

    <div className="content">
        <Outlet />
         </div>
     </div>
    </div>
  )
}


export default Dashboard;
