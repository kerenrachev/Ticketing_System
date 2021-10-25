import express from 'express';
import bodyParser = require('body-parser');
import { tempData } from './temp-data';
import { serverAPIPort, APIPath } from '@fed-exam/config';
import { Ticket } from '../client/src/api';


console.log('starting server', { serverAPIPort, APIPath });

const app = express();

const PAGE_SIZE = 5;

app.use(bodyParser.json());

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.post(APIPath, (req, res) => {
  // @ts-ignore
  var page: number = req.query.page;
  const sortedBy= req.query.sortedBy;
  const sortMethod= req.query.sortMethod;
  const filteredByArray : string[]= req.body.filterArray;
  var numberOfPages = tempData.length/PAGE_SIZE;
  var labelSet =  new Set <string>();
  var tempLabelsArray;
  tempData.map((ticket)=>{
    if(ticket!= undefined && ticket.labels != undefined ){
      ticket.labels.map((label)=>{
        labelSet.add(label);
      });
    }
    tempLabelsArray = Array.from(labelSet);
  });
  var paginatedData = tempData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  var filtered= false , sorted = false;
  var filteredData;
  if(filteredByArray[0]!='none' && filteredByArray[0] != undefined){
    filtered = true;
    var temp = new Set<Ticket>(); 
    for(var i=0 ; i<tempData.length; i++){ 
        for(var j=0; j<filteredByArray.length;j++){ 
            if(tempData[i]?.labels?.includes(filteredByArray[j]))
              temp.add(tempData[i]); 
        }
    }  
    numberOfPages = temp.size/PAGE_SIZE;
    if(page>numberOfPages)
      page = Math.ceil(numberOfPages);
    filteredData = Array.from(temp);
    paginatedData = filteredData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
   
  }
  var helper;
  if(filtered)
    helper = filteredData;
  else helper = tempData.slice();
  if(sortedBy && sortMethod && sortedBy!='none' && sortMethod!='none'&& helper!= undefined){
    if(sortedBy == 'date'){
      if (sortMethod == 'asc')
        helper=helper.sort((ticket1 : Ticket, ticket2 : Ticket) => (new Date(ticket1.creationTime).getTime() < new Date(ticket2.creationTime).getTime()) ? -1 : 1);
      else 
        helper=helper.sort((ticket1 : Ticket, ticket2 : Ticket) => (new Date(ticket1.creationTime).getTime() > new Date(ticket2.creationTime).getTime()) ? -1 : 1);
    }
    if(sortedBy == 'title'){
      if(sortMethod == 'asc')
        helper=helper.sort((ticket1 : Ticket, ticket2 : Ticket) => (ticket1.title <ticket2.title) ? -1 : 1);
      else 
        helper=helper.sort((ticket1 : Ticket, ticket2 : Ticket) => (ticket1.title >ticket2.title) ? -1 : 1);
    }
    if(sortedBy == 'email'){
      if(sortMethod == 'asc')
        helper=helper.sort((ticket1 : Ticket, ticket2 : Ticket) => (ticket1.userEmail < ticket2.userEmail) ? -1 : 1);
      else 
        helper=helper.sort((ticket1 : Ticket, ticket2 : Ticket) => (ticket1.userEmail > ticket2.userEmail) ? -1 : 1);
    }
    paginatedData = helper.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }
  
  res.send({paginatedData: paginatedData, numberOfPages : numberOfPages, page : page, labelSet:tempLabelsArray});
});
app.listen(serverAPIPort);
console.log('server running', serverAPIPort);

