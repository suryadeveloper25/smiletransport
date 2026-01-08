import { LOGIN,LOGOUT } from "./type"

const initialState = {
    isAuthenticated: false
}


export default (state= initialState,  {type, payload}:any) => {
   
   switch(type){
    case LOGIN:
        return {...state, isAuthenticated: payload}
    case LOGOUT:
        return {...state, isAuthenticated: false}
   }
   
    return state

}