import { LOGIN,LOGOUT } from "./type"

export const loginAction = () =>{
    return{
        type: LOGIN,
        payload: true
    }
}


export const logoutAction = () =>{
    return{
        type: LOGOUT,
        payload: false
    }
}