import axios from 'axios';
import {APIRootPath} from '@fed-exam/config';

export type Ticket = {
    id: string,
    title: string;
    content: string;
    creationTime: number;
    userEmail: string;
    labels?: string[];
}

export type ApiClient = {
    getTickets: (pageNum : number, sortedBy: string, method: string, filteredByArray : string[]) => Promise<Ticket[]>;
}

export const createApiClient = (): ApiClient => { 
    return {
        getTickets: (pageNum : number, sortedBy: string, method: string,filteredByArray : string[]) => {
                return axios.post(APIRootPath+'?page='+pageNum+'&&sortedBy='+sortedBy+'&&sortMethod='+method, {filterArray: filteredByArray}).then((res) =>{
                    return res.data;
                } );
           
        }
    }
}
