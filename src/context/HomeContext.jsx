// src/context/HomeContext.jsx
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';

export const HomeContext = createContext();
export const useHome = () => useContext(HomeContext);

export const HomeProvider = ({ children }) => {
  const [currentHome, setCurrentHome] = useState(null);
  const [homes,       setHomes]       = useState([]);
  const [members,     setMembers]     = useState([]);
  const [meals,       setMeals]       = useState([]);
  const [expenses,    setExpenses]    = useState([]);
  const [report,      setReport]      = useState(null);

  const addMeal    = (meal)    => setMeals(prev    => [meal,    ...prev]);
  const addExpense = (expense) => setExpenses(prev => [expense, ...prev]);
  const removeMeal = (id)      => setMeals(prev    => prev.filter(m => m._id !== id));
  const removeExpense = (id)   => setExpenses(prev => prev.filter(e => e._id !== id));
  const resetHomeState = () => {
    setCurrentHome(null);
    setHomes([]);
    setMembers([]);
    setMeals([]);
    setExpenses([]);
    setReport(null);
  };

  return (
    <HomeContext.Provider value={{
      currentHome, setCurrentHome,
      homes,       setHomes,
      members,     setMembers,
      meals,       setMeals,       addMeal,    removeMeal,
      expenses,    setExpenses,    addExpense, removeExpense,
      report,      setReport,
      resetHomeState,
    }}>
      {children}
    </HomeContext.Provider>
  );
};
