/*
	One True List

	Copyright (c) 2019 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



const Subscriber = require( '../../Subscriber.js' ) ;
const Subscription = require( '../../Subscription.js' ) ;
const Overview = require( '../../Overview.js' ) ;
const List = require( '../../List.js' ) ;
const Item = require( '../../Item.js' ) ;
const Task = require( '../../Task.js' ) ;
const Query = require( '../../Query.js' ) ;

const InfoPage = require( './InfoPage.js' ) ;
const EditPage = require( './EditPage.js' ) ;

const path = require( 'path' ) ;

const Promise = require( 'seventh' ) ;
const term = require( 'terminal-kit' ).terminal ;



function App( subscriber , config ) {
	this.subscriber = subscriber ;
	this.config = config ;
	this.query = new Query() ;
	this.localOverview = null ;
}

module.exports = App ;



App.prototype.start = async function() {
	term.on( 'key' , ( name ) => {
		if ( name === 'CTRL_C' ) {
			this.quit() ;
		}
	} ) ;

	for ( ;; ) {
		await this.subscriptionsView() ;
	}
} ;



App.prototype.quit = async function() {
	term.moveTo( 1 , term.height ) ;
	term.styleReset() ;
	term.green( 'Quitting...' ) ;
	term( '\n' ) ;
	term.processExit() ;

	// Add a big timeout before exiting anyway
	await Promise.resolveTimeout( 10000 ) ;
	process.exit() ;
} ;



App.prototype.subscriptionsView = async function() {
	// Load subscription and list
	await this.subscriber.load( 2 ) ;

	var infoPage = new InfoPage( {
		title: "Subscriptions view" ,
		titleDetail: this.subscriber.name ,
		breadCrumb: [] ,
		listMenu: this.subscriber.subscriptions.map( subscription => {
			if ( subscription.remoteErrorStatus ) {
				return {
					label: '<subscription error: ' + subscription.remoteErrorStatus.type + '>' ,
					error: subscription.remoteErrorStatus
				} ;
			}

			if ( subscription.list.remoteErrorStatus ) {
				return {
					label: '<list error: ' + subscription.list.remoteErrorStatus.type + '>' ,
					error: subscription.list.remoteErrorStatus
				} ;
			}

			return {
				action: 'subscriptionDetailView' ,
				target: subscription ,
				label: subscription.list.title
			} ;
		} ).concat( this.subscriber.overviews.filter( overview => overview.global ).map( overview => {
			if ( overview.remoteErrorStatus ) {
				return {
					label: '<overview error: ' + overview.remoteErrorStatus.type + '>' ,
					error: overview.remoteErrorStatus
				} ;
			}

			return {
				action: 'overviewDetailView' ,
				target: overview ,
				label: 'Overview: ' + overview.title
			} ;
		} ) ) ,
		topMenu: [
			{ action: 'quit' , shortcuts: 'ESCAPE' , label: 'Quit' } ,
			{
				label: 'Subscription' ,
				subMenu: [
					{ action: 'subscribe' , label: 'Subscribe to a list' } ,
					{ action: 'createAndSubscribe' , label: 'Create a list' }
				]
			} ,
			{
				label: 'Overview' ,
				subMenu: [
					{ action: 'createOverview' , label: 'Create an overview' } ,
					{ action: 'localOverviews' , label: 'Local overviews' }
				]
			}
		]
	} ) ;

	var submittedItem = await infoPage.run() ;

	switch ( submittedItem.action ) {
		case 'quit' :
			return this.quit() ;
		case 'subscribe' :
			return this.subscribe() ;
		case 'createAndSubscribe' :
			return this.createAndSubscribe() ;
		case 'createOverview' :
			return this.createOverview( true ) ;
		case 'subscriptionDetailView' :
			return this.listView( submittedItem.target , submittedItem.target.list ) ;
		case 'overviewDetailView' :
			return this.overviewView( submittedItem.target ) ;
		case 'localOverviews' :
			return this.localOverviewsView() ;
	}
} ;



App.prototype.subscribe = async function() {
	var editPage , formData , subscription ;

	editPage = new EditPage( {
		title: "Subscribe to an existing list" ,
		titleDetail: this.subscriber.name ,
		breadCrumb: [] ,
		fields: [
			{ key: 'url' , label: "List URL: " }
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		subscription = new Subscription( {
			postUrl: this.subscriber.url + '/subscriptions' ,
			list: { url: formData.fields.url }
		} ) ;

		await subscription.save() ;

		this.subscriber.addSubscription( subscription ) ;
		await this.subscriber.save() ;
	}
} ;



App.prototype.createAndSubscribe = async function() {
	var editPage , formData , list , subscription ;

	editPage = new EditPage( {
		title: "Create a new list and subscribe to it" ,
		titleDetail: this.subscriber.name ,
		breadCrumb: [] ,
		fields: [
			{ key: 'postUrl' , label: "Post list to URL: " , content: this.subscriber.url + '/lists' } ,
			{ key: 'title' , label: "Title: " } ,
			{ key: 'description' , label: "Description: " , height: 8 } ,
			{ key: 'tags' , label: "Tags: " }
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		list = new List( formData.fields ) ;
		await list.save() ;

		subscription = this.subscriber.addSubscription( {
			postUrl: this.subscriber.url + '/subscriptions' ,
			list: list
		} ) ;

		await subscription.save() ;
		await this.subscriber.save() ;
	}
} ;



App.prototype.localOverviewsView = async function() {
	for ( ;; ) {
		// Load subscription and list
		await this.subscriber.load( 2 ) ;

		var infoPage = new InfoPage( {
			title: "Local overviews view" ,
			titleDetail: this.subscriber.name ,
			breadCrumb: [] ,
			listMenu: this.subscriber.overviews.filter( overview => ! overview.global ).map( overview => {
				if ( overview.remoteErrorStatus ) {
					return {
						label: '<overview error: ' + overview.remoteErrorStatus.type + '>' ,
						error: overview.remoteErrorStatus
					} ;
				}

				return {
					action: 'editOverview' ,
					target: overview ,
					label: 'Overview: ' + overview.title
				} ;
			} ) ,
			topMenu: [
				{ action: 'back' , shortcuts: 'ESCAPE' , label: '◀' }
			] ,
			line1: [
				{
					type: 'button' ,
					action: 'createOverview' ,
					label: 'Create an overview'
				}
			]
		} ) ;

		var submittedItem = await infoPage.run() ;

		switch ( submittedItem.action ) {
			case 'createOverview' :
				await this.createOverview( false ) ;
				break ;
			case 'editOverview' :
				await this.editOverview( submittedItem.target ) ;
				break ;
			case 'back' :
				return ;
		}
	}
} ;



App.prototype.createOverview = async function( isGlobal ) {
	var editPage , formData , overview , data ;

	editPage = new EditPage( {
		title: "Create an overview" ,
		titleDetail: this.subscriber.name ,
		breadCrumb: [] ,
		fields: [
			{ key: 'postUrl' , label: "Post list to URL: " , content: this.subscriber.url + '/overviews' } ,
			{ key: 'title' , label: "Title: " } ,

			{ key: 'maxPriority' , label: "Priority ≤ " } ,
			{ key: 'minPriority' , label: "Priority ≥ " } ,
			{ key: 'maxValue' , label: "Value ≤ " } ,
			{ key: 'minValue' , label: "Value ≥ " } ,
			{ key: 'maxEffort' , label: "Effort ≤ " } ,
			{ key: 'minEffort' , label: "Effort ≥ " } ,

			{ key: 'tags' , label: "Tags: " } ,
			{ key: 'notTags' , label: "Not Tags: " } ,
			{ key: 'statuses' , label: "Statuses: " } ,
			{ key: 'notStatuses' , label: "Not Statuses: " } ,

			{ key: 'tagsScore' , label: "Tags score: " } ,
			{ key: 'statusesScore' , label: "Statuses score: " } ,

			{ key: 'rankWeight' , label: "Rank weight: " } ,
			{ key: 'priorityWeight' , label: "Priority weight: " } ,
			{ key: 'valueWeight' , label: "Value weight: " } ,
			{ key: 'effortWeight' , label: "Effort weight: " } ,
			{ key: 'tagsWeight' , label: "Tags weight: " } ,
			{ key: 'statusWeight' , label: "Status weight: " }
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		data = {
			postUrl: formData.fields.postUrl ,
			title: formData.fields.title ,
			"global": isGlobal ,
			query: formData.fields
		} ;

		overview = this.subscriber.addOverview( data ) ;
		await overview.save() ;
		await this.subscriber.save() ;
	}
} ;



App.prototype.listView = async function( subscription , list ) {
	var infoPage , submittedItem , items , itemsMeta ;

	for ( ;; ) {
		// Load the list and its items
		await list.load( 1 ) ;

		itemsMeta = new Map() ;
		items = this.query.apply( list.items , itemsMeta ) ;

		infoPage = new InfoPage( {
			breadCrumb: [ list.title ] ,
			title: "List view" ,
			titleDetail: list.title ,
			query: this.query ,
			listMenu: items.map( item => {
				if ( item.remoteErrorStatus ) {
					return {
						label: '<error: ' + item.remoteErrorStatus.type + '>' ,
						error: item.remoteErrorStatus
					} ;
				}

				return {
					action: 'itemView' ,
					target: item ,
					label: this.itemHilightText( item , itemsMeta.get( item ) )
				} ;
			} ) ,
			topMenu: [
				{ action: 'back' , shortcuts: 'ESCAPE' , label: '◀' } ,
				{
					label: 'Edit' ,
					subMenu: [
						{ action: 'editSubscription' , label: 'Edit subscription' } ,
						{ action: 'editList' , label: 'Edit list' } ,
						{ action: 'deleteSubscription' , label: 'Delete subscription' } ,
						{ action: 'deleteList' , label: 'Delete list' }
					]
				}
			] ,
			line1: [
				{
					type: 'button' ,
					action: 'newItem' ,
					label: 'New item'
				} ,
				{
					type: 'button' ,
					action: 'reset' ,
					label: 'Reset filters'
				}
			] ,
			line2: [
				{
					type: 'select' ,
					action: 'useOverview' ,
					label: 'Overview' ,
					actual: this.localOverview ,
					items: [
						{ label: '^-No overview' , value: null } ,
						... this.subscriber.overviews.filter( overview => ! overview.global )
							.map( overview => ( { label: overview.title , value: overview } ) )
					]
				} ,
				{
					type: 'selectMulti' ,
					action: 'statuses' ,
					label: 'Statuses' ,
					actual: this.query.statuses ,
					items: [
						{ label: 'proposal' , key: 'proposal' } ,
						{ label: 'specified' , key: 'specified' } ,
						{ label: 'todo' , key: 'todo' } ,
						{ label: 'in-progress' , key: 'in-progress' } ,
						{ label: 'done' , key: 'done' } ,
						{ label: 'accepted' , key: 'accepted' } ,
						{ label: 'incomplete' , key: 'incomplete' } ,
						{ label: 'rejected' , key: 'rejected' }
					]
				} ,
				{
					type: 'select' ,
					action: 'maxPriority' ,
					label: 'Priority' ,
					actual: this.query.maxPriority ,
					items: [
						{ label: '^-Priority ≤' , value: null } ,
						{ label: 'Priority ≤ 1' , value: 1 } ,
						{ label: 'Priority ≤ 2' , value: 2 } ,
						{ label: 'Priority ≤ 3' , value: 3 }
					]
				} ,
				{
					type: 'select' ,
					action: 'maxValue' ,
					label: 'Value' ,
					actual: this.query.maxValue ,
					items: [
						{ label: '^-Value ≤' , value: null } ,
						{ label: 'Value ≤ 0' , value: 0 } ,
						{ label: 'Value ≤ 1' , value: 1 } ,
						{ label: 'Value ≤ 2' , value: 2 } ,
						{ label: 'Value ≤ 3' , value: 3 } ,
						{ label: 'Value ≤ 5' , value: 5 } ,
						{ label: 'Value ≤ 8' , value: 8 } ,
						{ label: 'Value ≤ 13' , value: 13 } ,
						{ label: 'Value ≤ 21' , value: 21 } ,
						{ label: 'Value ≤ 34' , value: 34 } ,
						{ label: 'Value ≤ 55' , value: 55 } ,
						{ label: 'Value ≤ 100' , value: 100 }
					]
				} ,
				{
					type: 'select' ,
					action: 'minValue' ,
					label: 'Value' ,
					actual: this.query.minValue ,
					items: [
						{ label: '^-Value ≥' , value: null } ,
						{ label: 'Value ≥ 0' , value: 0 } ,
						{ label: 'Value ≥ 1' , value: 1 } ,
						{ label: 'Value ≥ 2' , value: 2 } ,
						{ label: 'Value ≥ 3' , value: 3 } ,
						{ label: 'Value ≥ 5' , value: 5 } ,
						{ label: 'Value ≥ 8' , value: 8 } ,
						{ label: 'Value ≥ 13' , value: 13 } ,
						{ label: 'Value ≥ 21' , value: 21 } ,
						{ label: 'Value ≥ 34' , value: 34 } ,
						{ label: 'Value ≥ 55' , value: 55 } ,
						{ label: 'Value ≥ 100' , value: 100 }
					]
				} ,
				{
					type: 'select' ,
					action: 'maxEffort' ,
					label: 'Effort' ,
					actual: this.query.maxEffort ,
					items: [
						{ label: '^-Effort ≤' , value: null } ,
						{ label: 'Effort ≤ 0' , value: 0 } ,
						{ label: 'Effort ≤ 1' , value: 1 } ,
						{ label: 'Effort ≤ 2' , value: 2 } ,
						{ label: 'Effort ≤ 3' , value: 3 } ,
						{ label: 'Effort ≤ 5' , value: 5 } ,
						{ label: 'Effort ≤ 8' , value: 8 } ,
						{ label: 'Effort ≤ 13' , value: 13 } ,
						{ label: 'Effort ≤ 21' , value: 21 } ,
						{ label: 'Effort ≤ 34' , value: 34 } ,
						{ label: 'Effort ≤ 55' , value: 55 } ,
						{ label: 'Effort ≤ 100' , value: 100 }
					]
				} ,
				{
					type: 'select' ,
					action: 'minEffort' ,
					label: 'Effort' ,
					actual: this.query.minEffort ,
					items: [
						{ label: '^-Effort ≥' , value: null } ,
						{ label: 'Effort ≥ 0' , value: 0 } ,
						{ label: 'Effort ≥ 1' , value: 1 } ,
						{ label: 'Effort ≥ 2' , value: 2 } ,
						{ label: 'Effort ≥ 3' , value: 3 } ,
						{ label: 'Effort ≥ 5' , value: 5 } ,
						{ label: 'Effort ≥ 8' , value: 8 } ,
						{ label: 'Effort ≥ 13' , value: 13 } ,
						{ label: 'Effort ≥ 21' , value: 21 } ,
						{ label: 'Effort ≥ 34' , value: 34 } ,
						{ label: 'Effort ≥ 55' , value: 55 } ,
						{ label: 'Effort ≥ 100' , value: 100 }
					]
				}
			]
		} ) ;

		submittedItem = await infoPage.run() ;

		switch ( submittedItem.action ) {
			case 'editSubscription' :
				await this.editSubscription( subscription , list ) ;
				break ;
			case 'editList' :
				await this.editList( list ) ;
				break ;
			case 'deleteSubscription' :
				await this.deleteSubscription( subscription , list ) ;
				return ;
			case 'deleteList' :
				await this.deleteList( subscription , list ) ;
				return ;
			case 'newItem' :
				await this.newItem( list ) ;
				break ;
			case 'itemView' :
				await this.itemView( list , submittedItem.target ) ;
				break ;
			case 'maxPriority' :
			case 'maxValue' :
			case 'minValue' :
			case 'maxEffort' :
			case 'minEffort' :
				this.query.set( { [ submittedItem.action ]: submittedItem.value } ) ;
				break ;
			case 'useOverview' :
				this.localOverview = submittedItem.value ;
				if ( ! this.localOverview ) { this.query.reset() ; }
				else { this.query.set( this.localOverview.query , true ) ; }
				break ;
			case 'reset' :
				this.localOverview = null ;
				this.query.reset() ;
				break ;
			case 'back' :
				return ;
		}
	}
} ;



App.prototype.editSubscription = async function( subscription , list ) {
	var editPage , formData ;

	editPage = new EditPage( {
		title: 'Edit subscription' ,
		titleDetail: list.title ,
		breadCrumb: [ list.title ] ,
		fields: [
			{ key: 'priorityShift' , label: "Priority shift: " , content: subscription.priorityShift } ,
			{ key: 'valueRate' , label: "Value rate: " , content: subscription.valueRate } ,
			{ key: 'effortRate' , label: "Effort rate: " , content: subscription.effortRate } ,
			{ key: 'tags' , label: "Tags: " , content: subscription.tags && subscription.tags.join( ',' ) }
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		subscription.set( formData.fields ) ;
		await subscription.save() ;
	}
} ;



App.prototype.editList = async function( list ) {
	var editPage , formData ;

	editPage = new EditPage( {
		title: 'Edit list' ,
		titleDetail: list.title ,
		breadCrumb: [ list.title ] ,
		fields: [
			{ key: 'title' , label: "Title: " , content: list.title } ,
			{
				key: 'description' , label: "Description: " , height: 8 , content: list.description
			} ,
			{ key: 'tags' , label: "Tags: " , content: list.tags && list.tags.join( ',' ) }
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		list.set( formData.fields ) ;
		await list.save() ;
	}
} ;



App.prototype.deleteSubscription = async function( subscription , list ) {
	var editPage , formData ;

	editPage = new EditPage( {
		title: 'Delete subscription' ,
		titleDetail: list.title ,
		breadCrumb: [ list.title ] ,
		fields: []
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		await this.subscriber.removeSubscription( subscription ) ;
		await subscription.delete() ;
		await this.subscriber.save() ;
	}
} ;



App.prototype.deleteList = async function( subscription , list ) {
	var editPage , formData ;

	editPage = new EditPage( {
		title: 'Delete list' ,
		titleDetail: list.title ,
		breadCrumb: [ list.title ] ,
		fields: []
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		await this.subscriber.removeSubscription( subscription ) ;
		await list.delete() ;
		await subscription.delete() ;
		await this.subscriber.save() ;
	}
} ;



App.prototype.newItem = async function( list ) {
	var editPage , formData , item ;

	editPage = new EditPage( {
		title: "New item" ,
		titleDetail: list.title ,
		breadCrumb: [ list.title ] ,
		fields: [
			{ key: 'title' , label: "Title: " } ,
			{ key: 'tags' , label: "Tags: " } ,
			{ key: 'description' , label: "Description: " , height: 8 } ,
			{
				key: 'status' ,
				label: "Status: " ,
				type: 'select' ,
				value: 'proposal' ,
				items: [
					{ content: 'proposal' , value: 'proposal' } ,
					{ content: 'specified' , value: 'specified' } ,
					{ content: 'todo' , value: 'todo' } ,
					{ content: 'in-progress' , value: 'in-progress' } ,
					{ content: 'done' , value: 'done' } ,
					{ content: 'accepted' , value: 'accepted' } ,
					{ content: 'incomplete' , value: 'incomplete' } ,
					{ content: 'rejected' , value: 'rejected' }
				]
			} ,
			{
				key: 'priority' ,
				label: "Priority: " ,
				type: 'select' ,
				value: 2 ,
				items: [
					{ content: 'P1' , value: 1 } ,
					{ content: 'P2' , value: 2 } ,
					{ content: 'P3' , value: 3 }
				]
			} ,
			{
				key: 'value' ,
				label: "Value: " ,
				type: 'select' ,
				value: 1 ,
				items: [
					{ content: '0' , value: 0 } ,
					{ content: '1' , value: 1 } ,
					{ content: '2' , value: 2 } ,
					{ content: '3' , value: 3 } ,
					{ content: '5' , value: 5 } ,
					{ content: '8' , value: 8 } ,
					{ content: '13' , value: 13 } ,
					{ content: '21' , value: 21 } ,
					{ content: '34' , value: 34 } ,
					{ content: '55' , value: 55 } ,
					{ content: '100' , value: 100 }
				]
			} ,
			{
				key: 'effort' ,
				label: "Effort: " ,
				type: 'select' ,
				value: 1 ,
				items: [
					{ content: '0' , value: 0 } ,
					{ content: '1' , value: 1 } ,
					{ content: '2' , value: 2 } ,
					{ content: '3' , value: 3 } ,
					{ content: '5' , value: 5 } ,
					{ content: '8' , value: 8 } ,
					{ content: '13' , value: 13 } ,
					{ content: '21' , value: 21 } ,
					{ content: '34' , value: 34 } ,
					{ content: '55' , value: 55 } ,
					{ content: '100' , value: 100 }
				]
			}
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		item = list.addItem( Object.assign( formData.fields , { postUrl: list.url + '/items' } ) ) ;
		await item.save() ;
		await list.save() ;
	}
} ;



App.prototype.overviewView = async function( overview ) {
	var infoPage , submittedItem , items , itemsMeta ;

	for ( ;; ) {
		// Load all items of the overview
		itemsMeta = new Map() ;
		items = await overview.getItems( this.subscriber , itemsMeta ) ;

		infoPage = new InfoPage( {
			breadCrumb: [ overview.title ] ,
			title: "Overview" ,
			titleDetail: overview.title ,
			listMenu: items.map( item => {
				if ( item.remoteErrorStatus ) {
					return {
						label: '<error: ' + item.remoteErrorStatus.type + '>' ,
						error: item.remoteErrorStatus
					} ;
				}

				return {
					action: 'itemView' ,
					target: item ,
					label: this.itemHilightText( item , itemsMeta.get( item ) )
				} ;
			} ) ,
			topMenu: [
				{ action: 'back' , shortcuts: 'ESCAPE' , label: '◀' } ,
				{
					label: 'Edit' ,
					subMenu: [
						{ action: 'editOverview' , label: 'Edit' } ,
						{ action: 'deleteOverview' , label: 'Delete' }
					]
				}
			]
		} ) ;

		submittedItem = await infoPage.run() ;

		switch ( submittedItem.action ) {
			case 'itemView' :
				await this.itemView( overview , submittedItem.target ) ;
				break ;
			case 'editOverview' :
				await this.editOverview( overview ) ;
				break ;
			case 'deleteOverview' :
				await this.deleteOverview( overview ) ;
				return ;
			case 'back' :
				return ;
		}
	}
} ;



App.prototype.editOverview = async function( overview ) {
	var editPage , formData ;

	editPage = new EditPage( {
		title: 'Edit overview' ,
		titleDetail: overview.title ,
		breadCrumb: [ overview.title ] ,
		fields: [
			{ key: 'title' , label: "Title: " , content: overview.title } ,

			{ key: 'maxPriority' , label: "Priority ≤ " , content: overview.query.maxPriority } ,
			{ key: 'minPriority' , label: "Priority ≥ " , content: overview.query.minPriority } ,
			{ key: 'maxValue' , label: "Value ≤ " , content: overview.query.maxValue } ,
			{ key: 'minValue' , label: "Value ≥ " , content: overview.query.minValue } ,
			{ key: 'maxEffort' , label: "Effort ≤ " , content: overview.query.maxEffort } ,
			{ key: 'minEffort' , label: "Effort ≥ " , content: overview.query.minEffort } ,

			{ key: 'tags' , label: "Tags: " , content: overview.query.tags && overview.query.tags.join( ',' ) } ,
			{ key: 'notTags' , label: "Not Tags: " , content: overview.query.notTags && overview.query.notTags.join( ',' ) } ,
			{ key: 'statuses' , label: "Statuses: " , content: overview.query.statuses && overview.query.statuses.join( ',' ) } ,
			{ key: 'notStatuses' , label: "Not Statuses: " , content: overview.query.notStatuses && overview.query.notStatuses.join( ',' ) } ,

			{ key: 'tagsScore' , label: "Tags score: " , content: objectToString( overview.query.tagsScore ) } ,
			{ key: 'statusesScore' , label: "Statuses score: " , content: objectToString( overview.query.statusesScore ) } ,

			{ key: 'rankWeight' , label: "Rank weight: " , content: overview.query.rankWeight } ,
			{ key: 'priorityWeight' , label: "Priority weight: " , content: overview.query.priorityWeight } ,
			{ key: 'valueWeight' , label: "Value weight: " , content: overview.query.valueWeight } ,
			{ key: 'effortWeight' , label: "Effort weight: " , content: overview.query.effortWeight } ,
			{ key: 'tagsWeight' , label: "Tags weight: " , content: overview.query.tagsWeight } ,
			{ key: 'statusWeight' , label: "Status weight: " , content: overview.query.statusWeight }
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		overview.setTitle( formData.fields.title ) ;
		overview.setQuery( formData.fields ) ;
		await overview.save() ;
	}
} ;



App.prototype.deleteOverview = async function( overview ) {
	var editPage , formData ;

	editPage = new EditPage( {
		title: 'Delete overview' ,
		titleDetail: overview.title ,
		breadCrumb: [ overview.title ] ,
		fields: []
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		await this.subscriber.removeOverview( overview ) ;
		await overview.delete() ;
		await this.subscriber.save() ;
	}
} ;



App.prototype.itemView = async function( list , item ) {
	for ( ;; ) {
		// Load the list and its items
		await item.load( 1 ) ;

		var infoPage = new InfoPage( {
			breadCrumb: [ list.title , item.title ] ,
			title: "Item view" ,
			titleDetail: this.itemHilightText( item , null , false ) ,
			listMenu: item.tasks.map( task => ( {
				action: 'taskView' ,
				target: task ,
				label: task.title
			} ) ) ,
			description: item.description ,
			topMenu: [
				{ action: 'back' , shortcuts: 'ESCAPE' , label: '◀' } ,
				{
					label: 'Edit' ,
					subMenu: [
						{ action: 'editItem' , label: 'Edit' } ,
						{ action: 'deleteItem' , label: 'Delete' }
					]
				}
			] ,
			line1: [
				{
					type: 'button' ,
					action: 'newTask' ,
					label: 'New task'
				}
			] ,
			line2: [
				{
					type: 'select' ,
					action: 'changeStatus' ,
					label: 'Status' ,
					actual: item.status ,
					items: [
						{ label: STATUS_MARKUP.proposal + 'Proposal' , value: 'proposal' } ,
						{ label: STATUS_MARKUP.specified + 'Specified' , value: 'specified' } ,
						{ label: STATUS_MARKUP.todo + 'Todo' , value: 'todo' } ,
						{ label: STATUS_MARKUP['in-progress'] + 'In Progress' , value: 'in-progress' } ,
						{ label: STATUS_MARKUP.done + 'Done' , value: 'done' } ,
						{ label: STATUS_MARKUP.accepted + 'Accepted' , value: 'accepted' } ,
						{ label: STATUS_MARKUP.incomplete + 'Incomplete' , value: 'incomplete' } ,
						{ label: STATUS_MARKUP.rejected + 'Rejected' , value: 'rejected' }
					]
				} ,
				{
					type: 'select' ,
					action: 'changePriority' ,
					label: 'Priority' ,
					actual: item.priority ,
					items: [
						{ label: 'Priority: 1' , value: 1 } ,
						{ label: 'Priority: 2' , value: 2 } ,
						{ label: 'Priority: 3' , value: 3 }
					]
				} ,
				{
					type: 'select' ,
					action: 'changeValue' ,
					label: 'Value' ,
					actual: item.value ,
					items: [
						{ label: 'Value: 0' , value: 0 } ,
						{ label: 'Value: 1' , value: 1 } ,
						{ label: 'Value: 2' , value: 2 } ,
						{ label: 'Value: 3' , value: 3 } ,
						{ label: 'Value: 5' , value: 5 } ,
						{ label: 'Value: 8' , value: 8 } ,
						{ label: 'Value: 13' , value: 13 } ,
						{ label: 'Value: 21' , value: 21 } ,
						{ label: 'Value: 34' , value: 34 } ,
						{ label: 'Value: 55' , value: 55 } ,
						{ label: 'Value: 100' , value: 100 }
					]
				} ,
				{
					type: 'select' ,
					action: 'changeEffort' ,
					label: 'Effort' ,
					actual: item.effort ,
					items: [
						{ label: 'Effort: 0' , value: 0 } ,
						{ label: 'Effort: 1' , value: 1 } ,
						{ label: 'Effort: 2' , value: 2 } ,
						{ label: 'Effort: 3' , value: 3 } ,
						{ label: 'Effort: 5' , value: 5 } ,
						{ label: 'Effort: 8' , value: 8 } ,
						{ label: 'Effort: 13' , value: 13 } ,
						{ label: 'Effort: 21' , value: 21 } ,
						{ label: 'Effort: 34' , value: 34 } ,
						{ label: 'Effort: 55' , value: 55 } ,
						{ label: 'Effort: 100' , value: 100 }
					]
				}
			]
		} ) ;

		var submittedItem = await infoPage.run() ;

		switch ( submittedItem.action ) {
			case 'changeStatus' :
				item.setStatus( submittedItem.value ) ;
				await item.save() ;
				break ;
			case 'changePriority' :
				item.setPriority( submittedItem.value ) ;
				await item.save() ;
				break ;
			case 'changeEffort' :
				item.setEffort( submittedItem.value ) ;
				await item.save() ;
				break ;
			case 'changeValue' :
				item.setValue( submittedItem.value ) ;
				await item.save() ;
				break ;
			case 'editItem' :
				await this.editItem( list , item ) ;
				break ;
			case 'deleteItem' :
				await this.deleteItem( list , item ) ;
				return ;
			case 'newTask' :
				await this.newTask( list , item ) ;
				break ;
			case 'taskView' :
				await this.taskView( list , item , submittedItem.target ) ;
				break ;
			case 'back' :
				return ;
		}
	}
} ;



App.prototype.editItem = async function( list , item ) {
	var editPage , formData ;

	editPage = new EditPage( {
		title: 'Edit item' ,
		titleDetail: item.title ,
		breadCrumb: [ list.title , item.title ] ,
		fields: [
			{ key: 'title' , label: "Title: " , content: item.title } ,
			{ key: 'tags' , label: "Tags: " , content: item.tags.join( ',' ) } ,
			{
				key: 'description' , label: "Description: " , height: 8 , content: item.description
			} ,
			{
				key: 'status' ,
				label: "Status: " ,
				type: 'select' ,
				value: item.status ,
				items: [
					{ content: 'proposal' , value: 'proposal' } ,
					{ content: 'specified' , value: 'specified' } ,
					{ content: 'todo' , value: 'todo' } ,
					{ content: 'in-progress' , value: 'in-progress' } ,
					{ content: 'done' , value: 'done' } ,
					{ content: 'accepted' , value: 'accepted' } ,
					{ content: 'incomplete' , value: 'incomplete' } ,
					{ content: 'rejected' , value: 'rejected' }
				]
			} ,
			{
				key: 'priority' ,
				label: "Priority: " ,
				type: 'select' ,
				value: item.priority ,
				items: [
					{ content: 'P1' , value: 1 } ,
					{ content: 'P2' , value: 2 } ,
					{ content: 'P3' , value: 3 }
				]
			} ,
			{
				key: 'value' ,
				label: "Value: " ,
				type: 'select' ,
				value: item.value ,
				items: [
					{ content: '0' , value: 0 } ,
					{ content: '1' , value: 1 } ,
					{ content: '2' , value: 2 } ,
					{ content: '3' , value: 3 } ,
					{ content: '5' , value: 5 } ,
					{ content: '8' , value: 8 } ,
					{ content: '13' , value: 13 } ,
					{ content: '21' , value: 21 } ,
					{ content: '34' , value: 34 } ,
					{ content: '55' , value: 55 } ,
					{ content: '100' , value: 100 }
				]
			} ,
			{
				key: 'effort' ,
				label: "Effort: " ,
				type: 'select' ,
				value: item.effort ,
				items: [
					{ content: '0' , value: 0 } ,
					{ content: '1' , value: 1 } ,
					{ content: '2' , value: 2 } ,
					{ content: '3' , value: 3 } ,
					{ content: '5' , value: 5 } ,
					{ content: '8' , value: 8 } ,
					{ content: '13' , value: 13 } ,
					{ content: '21' , value: 21 } ,
					{ content: '34' , value: 34 } ,
					{ content: '55' , value: 55 } ,
					{ content: '100' , value: 100 }
				]
			}
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		item.set( formData.fields ) ;
		await item.save() ;
	}
} ;



App.prototype.deleteItem = async function( list , item ) {
	var editPage , formData ;

	editPage = new EditPage( {
		title: 'Delete item' ,
		titleDetail: item.title ,
		breadCrumb: [ list.title , item.title ] ,
		fields: []
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		list.removeItem( item ) ;
		await item.delete() ;
		await list.save() ;
	}
} ;



App.prototype.newTask = async function( list , item ) {
	var editPage , formData , task ;

	editPage = new EditPage( {
		title: "New task" ,
		titleDetail: item.title ,
		breadCrumb: [ list.title , item.title ] ,
		fields: [
			{ key: 'title' , label: "Title: " } ,
			{ key: 'description' , label: "Description: " , height: 8 }
		]
	} ) ;

	formData = await editPage.run() ;

	if ( formData.submit === 'ok' ) {
		task = item.addTask( {
			postUrl: item.url + '/tasks' ,
			title: formData.fields.title ,
			description: formData.fields.description
		} ) ;

		await task.save() ;
		await item.save() ;
	}
} ;



App.prototype.taskView = async function( list , item , task ) {
	for ( ;; ) {
		// Load the list and its items
		await item.load( 1 ) ;

		var infoPage = new InfoPage( {
			breadCrumb: [ list.title , item.title , task.title ] ,
			title: "Task view" ,
			titleDetail: task.title ,
			description: item.description ,
			topMenu: [
				{ action: 'back' , shortcuts: 'ESCAPE' , label: '◀' }
			]
		} ) ;

		var submittedItem = await infoPage.run() ;

		switch ( submittedItem.action ) {
			case 'back' :
				return ;
		}
	}
} ;



// Helpers

const STATUS_MARKUP = {
	proposal: '^m^-' ,
	specified: '^M^-' ,
	todo: '^y^+' ,
	'in-progress': '^Y^+' ,
	done: '^g' ,
	accepted: '^G' ,
	incomplete: '^r^+' ,
	rejected: '^w^-'
} ;



App.prototype.itemHilightText = function( item , meta , markup = true ) {
	var str = '' , tags ,
		resetMarkup = markup ? '^:' : '' ,
		listMarkup = markup ? '^m' : '' ,
		itemMarkup = markup ? '^c' : '' ,
		metaMarkup = markup ? '^w^-' : '' ,
		tagMarkup = markup ? '^b' : '' ,
		statusMarkup = markup ? STATUS_MARKUP[ item.status ] || metaMarkup : '' ;

	if ( meta && meta.listTitle ) { str += listMarkup + '[' + meta.listTitle + '] ' ; }

	//console.error( meta ) ;
	str += itemMarkup + item.title + ' ' + metaMarkup + '(' + resetMarkup + statusMarkup + item.status + resetMarkup
		+ metaMarkup + '|P' + item.priority + '|V' + item.value + '|E' + item.effort
		+ ( meta && typeof meta.score === 'number' ? '|S' + Math.round( meta.score ) : '' )
		+ ')' ;

	tags = item.tags.join( ',' ) ;

	if ( tags ) { str += tagMarkup + ' [' + tags + ']' ; }

	str += resetMarkup ;

	return str ;
} ;



function objectToString( o ) {
	if ( ! o || typeof o !== 'object' ) { return '' ; }
	return Object.entries( o ).map( ( [ k , v ] ) => k + ':' + v )
		.join( ',' ) ;
}

