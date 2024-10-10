import { useAuth } from "../../auth/AuthContext"
import { Button } from "@mui/material"



const Navbar = () =>{

    const {isAuthenticated, user, logout} = useAuth()

    return isAuthenticated && user.username ? (<div>
            Welcome, {user ? user.username: "hi"}
            <Button onClick={() => logout()}>Logout</Button>
          </div>
    ) : (
        <div></div>
    )
}

export default Navbar;