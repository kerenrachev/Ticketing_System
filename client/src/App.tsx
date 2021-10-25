import React from 'react';
import './App.scss';
import {createApiClient, Ticket} from './api';


export type AppState = {
	tickets?: Ticket[],
	currentPage?: number,
	totalPages? : number,
	search: string;
}

//index 1- filter by date , index 2- filter by title, index 3- filter by email
var sortButtonClicked: number[];
var filteredBy : Set<string>;
var labelSet : Set<string>;
var filterDropDownDisplayed = false;
var newPage = true;
var sortedBy = 'none';
var sortMethod = 'none';
var asc = false;


const api = createApiClient();
export class App extends React.PureComponent<{}, AppState> {

	state: AppState = {
		search: ''
	}

	searchDebounce: any = null;
	async componentDidMount() {
		if(filteredBy!= undefined){
			var filteredByArray = Array.from(filteredBy);
			this.grabTicketsAsyncFunc(1, sortedBy, sortMethod,filteredByArray);
		}
		else {
			var tempArr = ['none'];
			this.grabTicketsAsyncFunc(1, sortedBy, sortMethod,tempArr);
		}
	}
	/*
	This function is called inside the renderTickets function.
	Iteraits all the labels inside each ticket, adding the labels in the labels set (labelSet)
	and returning an HTML element.
	*/
	renderLabels = (ticket: Ticket) =>{
		if(ticket.labels!=null){
			return ( <div className='labelsDiv'>{ticket.labels.map ((label) => (<input className='labels' value={label}/>))}</div>);
		}
		return (null);
	}

	renderTickets = (tickets: Ticket[]) => {
		if(newPage){
			filteredBy = new Set <string>();
			newPage= false;
		}
		const filteredTickets = tickets
			.filter((t) => (t.title.toLowerCase() + t.content.toLowerCase()).includes(this.state.search.toLowerCase()));
		const element =  (
			<div>
			<ul className='tickets'>
			{filteredTickets.map((ticket) => (<li key={ticket.id} className='ticket'>
				<div>
				<div className='title'><h5  id= {ticket.id} >{ticket.title}</h5></div>
				<div className= 'renameTitle'><button onClick={(event: any) => {ticket.title =""+ this.editTitleNameClickHandler(ticket.title, ticket.id) }}>Rename</button></div>
				</div>
					{this.displayContent(ticket)}
				{this.renderLabels(ticket) }
				<footer>
					<div className='meta-data'>By {ticket.userEmail} | { new Date(ticket.creationTime).toLocaleString()}</div>
					
				</footer>
			</li>))}
		</ul>{this.appendFilterOption()}
		</div>);
		
		return element;
	}


	/**This function is responsible for the title edit feature */
	editTitleNameClickHandler = (prevTitle: string, id: string) => {
		const res = window.prompt("Please edit the title and press OK: ",prevTitle);
		if( res == null)
		{
			return prevTitle;
		}
		const element = document.getElementById(id);
		if(element!= null)
			element.innerText= res;
		return res;
	}

	/**
	 * This function is called only once every time there is a change in states.
	 * It is responsible for defining the dropDown feauture (part 3) and its calling the "addOptionsToDropDown() func below."
	 */
	appendFilterOption =() =>{
		if(filterDropDownDisplayed== false){
			var element = document.getElementById('dropDown') as HTMLDivElement;
			if(element!=null){
				var select = document.createElement("SELECT");
				select.id = "dropDownLabels";
				select.className = "dropDownLabels";
				element.appendChild(select);
				var submitButton = document.createElement("BUTTON");
				submitButton.id ='submitFilterButton';
				submitButton.onclick = (e : any )=>{this.onClickSubmitFilterOption()};
				submitButton.innerHTML= 'Submit';
				submitButton.className = 'submitFilter';
				element.appendChild(submitButton);
			}
		}
		this.addOptionsToDropDown();
	}
	
	/**
	 * This function is called every time the state changes (it is called by appendFilterOption()),
	 * and it is appending the options to the drop down by looping over the "labelSet" set and calling the addDropDownOption() function.
	 */
	addOptionsToDropDown = () => {
		/*
		This if statment makes sure to allow filter by more than one label, each ticket that includes at least
		one of the labels that has been chosen will appear.
		newPage=true only when the client is requesting a new page
		*/
		var select = document.getElementById('dropDownLabels') as HTMLSelectElement;
		var numOfCurrentOptions = select.options.length;
		//Deleting all options in the select element
		select.innerHTML = "";
		var tempLabelArray = Array.from(labelSet);
		var option = document.createElement("option");
		option.text = "select label";
		option.disabled = true;
		option.selected = true;
		select.appendChild(option);
		if(tempLabelArray!=undefined ){
			tempLabelArray.map((label)=> (
				this.addDropDownOption(label, select)		
			));
		}
		filterDropDownDisplayed = true;
	}
	/**
	 * This funciton is called by addOptionsToDropDown(), recieving a label and the select element
	 * and adding this label as option.
	 */

	addDropDownOption = (label: string, select : Element) => {
		var element = document.getElementById('dropDown') as HTMLDivElement;
		if(element!=null){
			var option = document.createElement("option");
			option.value = label;
			option.text = label;
			select.appendChild(option);
		}
	}
	/**
	 * This function is called when the client is choosing a filter and clicks on the submit button.
	 * The label is added to the "filteredBy" set, which is sent later on to the grabTicketsAsyncFunc() function.
	 * Afterwards the grabTicketsAsyncFunc() func is making a request to the current page filtered by the relevant labels. 
	 */
	onClickSubmitFilterOption= () => {
		var select = document.getElementById('dropDownLabels') as HTMLSelectElement;
		var selectIndex = select.selectedIndex;
		var opt = select.options[selectIndex];
		var CurValue = (opt).value;
		var filterSelection = (opt).text;
		if(filterSelection!= 'select label'){
			filteredBy.add(filterSelection);
			var filteredByArray = Array.from(filteredBy);
			if(this.state.currentPage!= undefined){
				this.grabTicketsAsyncFunc(this.state.currentPage,sortedBy,sortMethod, filteredByArray);
			}
		}

	}
	/**
	 * Called as a return value in the renderTickets() func.
	 * Each time the client is choosing a filter ( and the setState() is called), the current 'filteredBy' labels
	 * are re-rendering, and displayed as buttons.
	 * If the client clicks on the choosen label, the function cancelFilter() will be called, and this selection will 
	 * be cancelled.
	 */
	renderFilteredByButtons =() =>{
		if(filteredBy!= null){
			var tempArr = Array.from(filteredBy);
			return (tempArr.map((label)=>(<button className='buttonsToFilterBy' id={'clickToCancelFilter'+label} onClick={(event: any) => {this.cancelFilter(label)}}>{label}</button>)));
		}
		return null;
	}
	/**
	 * This function allows canceling a chosen filter, called each time the client clicks on a label.
	 * This function is calling the grabTicketsAsyncFunc() function with the relevant parameters.
	 */
	cancelFilter = (label : string) => {
		//First removing the button 
		var buttonToRemove = document.getElementById('clickToCancelFilter'+label);

		// Update "filteredBy" set
		filteredBy.delete(label);
		var filteredByArr = Array.from(filteredBy);
		if(filteredBy.size!=0 && this.state.currentPage!= undefined)
			this.grabTicketsAsyncFunc(this.state.currentPage,sortedBy,sortMethod,filteredByArr);
		else {
			if(this.state.currentPage!= undefined){
				var temp = ['none'];
				this.grabTicketsAsyncFunc(this.state.currentPage,sortedBy,sortMethod,temp);
			}
		}
	}
	/**
	 * This function displayes the content of the tickets, and deals with the "Show more/ Show less" feature.
	 */
	displayContent = (ticket: Ticket) => {
		const showMoreButton = document.getElementById(ticket.id) as HTMLButtonElement;
		const maxLength = 350;
		
		if(ticket.content.length > maxLength){
			const firstPart = ticket.content.slice(0,maxLength-1);
			const secondpart = ticket.content.slice(maxLength, ticket.content.length-1);
			return (<div>
					<p>{firstPart}<span id={'dots'+ticket.id}>...</span><span className='more' id={'more'+ticket.id}>{secondpart}</span></p>
					<button className='moreLessButton' id={'moreLessButton'+ticket.id} onClick={(event: any) => {this.showMoreLess(ticket)}}>Read more</button>
					</div>);
		}
		else{
			 return (<div>
				 		<h5 className='content' id='content'>{ticket.content}</h5>
				 	</div>);
		}
	}

	/**
	 * Responible for the showMore / showLess bonus feature.
	 * 
	 */
	showMoreLess = (ticket: Ticket) =>{
		var dots = document.getElementById('dots'+ticket.id);
		var moreText = document.getElementById('more'+ticket.id);
		var btnText = document.getElementById('moreLessButton'+ticket.id);
		if(dots!= null && btnText!=null && moreText!=null ){
			if (dots.style.display === "none") {
				dots.style.display = "inline";
				btnText.innerHTML = "Read more";
				moreText.style.display = "none";
			} else {
				dots.style.display = "none";
				btnText.innerHTML = "Read less";
				moreText.style.display = "inline";
			}
		}
		
	}
	onSearch = async (val: string) => {
		clearTimeout(this.searchDebounce);
		this.searchDebounce = setTimeout(async () => {
			this.setState({
				search: val
			});
		}, 300);
	}

	render() {	
		const {tickets} = this.state;
		const {currentPage} = this.state;
		return (<main>
			<h1>Tickets List</h1>
			<header>
				<input type="search" placeholder="Search..." onChange={(e) => this.onSearch(e.target.value)}/>
			</header>
			{tickets ? <div className='results'>Showing {tickets.length} results</div> : null }	
			<div className='sortByTitles'>
				<input id='sortDate' value='sort by date' type='button' className='sortButton' onClick={(event: any) => {
					if(tickets!=undefined) this.sort('date',0,'sortDate') }}/>
				<input id= 'sortTitle' value='sort by title' type='button' className='sortButton' onClick={(event: any) => {
					if(tickets!=undefined) this.sort('title',1,'sortTitle')}}/>
				<input id= 'sortEmail' value='sort by email' type='button' className='sortButton' onClick={(event: any) => {
					if(tickets!=undefined) this.sort('email',2,'sortEmail')}}/>
			</div>
			<div className='filterLabels' id ='filterByLabelFeature'>
					<div id='dropDown' className='dropDown'></div>
					<div>{this.renderFilteredByButtons()}</div>
			</div>
			<div>
				<label  className='warning' id='warning' >Please insert only numbers</label>
			</div>
			<div>
				{currentPage ? this.showCurrentPageNumber(currentPage) : this.showCurrentPageNumber(1)}
				<label className='goToPageLabel'>Go to page</label>
				<input className="textField" id="pageNum" type="text" name="page" placeholder="page number" onChange={(event: any) =>{this.onChangePageField()}}/>
				<input className='okButton' value='Ok' id='okButton' type='button' onClick={() =>{this.requestPage()}}></input>
			</div>
			{tickets ? this.renderTickets(tickets) : <h2>Loading..</h2>}
		</main>)
	}

	/**
	 * Recieving a page number, and displaying it on the HTML page
	 */
	showCurrentPageNumber = (page: number) =>{
		return (<h6>Page Number {page}/{this.state.totalPages}</h6>);
	}
	/**
	 * This function risponsible for the client requests to the server.
	 * Its recieving the client's response as JSON object, parses it, and updates the relevant parameters in the class.
	 */
	grabTicketsAsyncFunc = async (page: number, sortedBy : string, method: string, labelsToFilterBy : string[]) =>{
		const serverRepsonseJson =  JSON.parse(JSON.stringify(await api.getTickets(page, sortedBy, method,labelsToFilterBy)));
		labelSet = serverRepsonseJson.labelSet;
		this.setState({
			tickets: serverRepsonseJson.paginatedData,
			currentPage: serverRepsonseJson.page,
			totalPages: Math.ceil(serverRepsonseJson.numberOfPages)
		}); 
	}

	/**
	 * Function that is called by the page text field (where the client can request for a page in the HTML page).
	 * Each time the client inserts a number\char, this function is validating the client's input to avoid errors.
	 */
	onChangePageField = ()=> {
		const element = (document.getElementById('pageNum') as HTMLInputElement).value;
		const labelEl = document.getElementById('warning');
	    const okButton = document.getElementById('okButton') as HTMLButtonElement;

		if( this.state.totalPages!=undefined){
			if( +element<0 || +element > this.state.totalPages)
			{
				if(labelEl!=null){
					labelEl.innerText = 'Num of page does not exist';
					labelEl.style.visibility = "visible";
					okButton.disabled =true;
				}
			}
			else if( +element>0 || +element <this.state.totalPages)
			{
				if(labelEl!=null){
					labelEl.style.visibility = "hidden";
					okButton.disabled =false;
				}
			}
			else{
				if(labelEl!=null){
					labelEl.innerText = 'Please insert only numbers';
					labelEl.style.visibility = "visible";
					okButton.disabled =true;
				}
			} 
		}
		
	}
	/**
	 * This function is called when the client presses the "ok" button (to request a page),
	 * calls the grabTicketsAsyncFunc() function, after validating the value in advance.
	 */
	requestPage =() =>{
		//filteredBy = new Set<string>();
		const element = (document.getElementById('pageNum') as HTMLInputElement).value;
		if(element!=null){
			this.state.currentPage = +element;
			if(this.state.currentPage!=undefined)
			{
				var temp = Array.from(filteredBy);
				this.grabTicketsAsyncFunc(this.state.currentPage, sortedBy, sortMethod,temp);
			}
		}
	}
	/**
	 * This function is called whenever the client clicks on a sort button.
	 * The "sortButtonClicked" array holds the number of times each sort button has been clicked.
	 * index 1- sort date, index 2- sort title, index 3- sort email
	 * value of 1- ASC order, value of 2- DSC order, value of 3- Cancel sorting.
	 */
	sort = (sortType: string, indexInArray : number, elemntId : string) =>{
		sortedBy = sortType;
		if(sortButtonClicked== null){
			sortButtonClicked = [0,0,0];
		}
		var specificButton = document.getElementById(elemntId) as HTMLButtonElement;
		var allButtons = document.getElementsByClassName('sortButton') ;
		var filteredByArr = Array.from(filteredBy);
		for(var i=0 ; i<allButtons.length; i++)
			if(sortButtonClicked[i]>0)
			{
				(allButtons[i] as HTMLButtonElement).style.background = '#B0E0E6';
			}
		if(sortButtonClicked[indexInArray]<2 && specificButton!= null){
			if(this.state.currentPage!=undefined ){
				
				if(sortButtonClicked[indexInArray]==0){
					sortMethod = 'asc';
					specificButton.style.background = '#008B8B'
					sortButtonClicked = [0,0,0];
					this.grabTicketsAsyncFunc(this.state.currentPage,sortType,'asc',filteredByArr);
				}
				else if(sortButtonClicked[indexInArray]==1){
					sortMethod = 'dsc';
					specificButton.style.background = '#6495ED'
					this.grabTicketsAsyncFunc(this.state.currentPage,sortType,'dsc',filteredByArr);
				}
			}
			sortButtonClicked[indexInArray]+=1;
		}
		else if(this.state.currentPage!=undefined ){
			specificButton.style.background= '#B0E0E6';
			sortMethod = 'none';
			sortType = 'none';
			this.grabTicketsAsyncFunc(this.state.currentPage,'none','none',filteredByArr);
			sortButtonClicked[indexInArray] = 0;
		}
	}

}

export default App;