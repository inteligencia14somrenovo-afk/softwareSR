import React from 'react';
import "./Dashboard.css";
import Sidebar from '../components/Sidebar/Sidebar';
import Header from '../components/Header/Header';
import TelaInicial from '../pages/TelaInicial/TelaInicial';

const Dashboard = () => {
  
  
  
  return (



    <div className="dashboard">
        <Sidebar />

    <div className="main">
         <Header />

    <div className="content">
        <TelaInicial />
         </div>
     </div>
    </div>
  )
}


export default Dashboard;
