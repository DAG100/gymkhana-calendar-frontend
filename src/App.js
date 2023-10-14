import React, {useState, useEffect, createContext} from "react";
import RevoCalendar from "./revo-calendar";

const UserContext = createContext({user:"user", organisation:""});

function App() {
	const [user, setUser] = useState({level: "user", organisation: ""});

  return (
    <div className="App">
    	<UserContext.Provider value={{
    		user: user.level,
    		organisation: user.organisation
    	}}>
			<h1> trivial Change </h1>
			<RevoCalendar />
		</UserContext.Provider>
    </div>
  );
}

export default App;
