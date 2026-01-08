import axios from 'axios';
import { API_URL } from '../Root/Config';

export const postService = async (endPoint: any, data: any) => {
   let fullPath = API_URL + endPoint;
   let resp = await axios.post(fullPath, data)
   return resp;
}
export const getService = async (endPoint: any) => {
   let fullPath = API_URL + endPoint;
   let resp = await axios.get(fullPath)
   return resp;
}
export const putService = async (endPoint: any, data: any) => {
   let fullPath = API_URL + endPoint;
   let resp = await axios.put(fullPath, data)
   return resp;
}




