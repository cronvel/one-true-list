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



const path = require( 'path' ) ;
const url = require( 'url' ) ;
const ErrorStatus = require( 'error-status' ) ;
const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



function SharedObject( data ) {
	this.url = ( data && data.url ) || null ;
	this.parsedUrl = null ;
	this.postUrl = ( data && data.postUrl ) || null ;
	this.parsedPostUrl = null ;
	this.connector = require( './connectors/dummy.js' ) ;
	this.isInit = false ;
	this.isLoaded = false ;
	this.remoteErrorStatus = null ;
}

module.exports = SharedObject ;



SharedObject.prototype.init = function() {
	var connectorName ;

	if ( this.isInit ) { return ; }

	if ( this.postUrl ) {
		if ( typeof this.postUrl !== 'string' ) { throw new Error( "No valid POST url for " + this.constructor.name ) ; }

		this.parsedPostUrl = url.parse( this.postUrl ) ;

		if ( ! this.parsedPostUrl.protocol ) { throw new Error( "No valid POST url for " + this.constructor.name + ", missing protocol: " + this.postUrl ) ; }

		connectorName = this.parsedPostUrl.protocol.replace( /[^a-z+-]/g , '' ) ;
		this.connector = require( './connectors/' + connectorName + '.js' ) ;
		//log.info( "POST URL: %Y\nConnector: %s" , this.parsedPostUrl , connectorName ) ;
		this.isInit = true ;
		return ;
	}

	if ( ! this.url || typeof this.url !== 'string' ) {
		this.remoteErrorStatus = ErrorStatus.badRequest( "No valid url for " + this.constructor.name ) ;
		return ;
	}

	this.parsedUrl = url.parse( this.url ) ;

	if ( ! this.parsedUrl.protocol ) {
		this.remoteErrorStatus = ErrorStatus.badRequest( "No valid url for " + this.constructor.name + ", missing protocol: " + this.url ) ;
		return ;
	}

	connectorName = this.parsedUrl.protocol.replace( /[^a-z+-]/g , '' ) ;

	try {
		this.connector = require( './connectors/' + connectorName + '.js' ) ;
	}
	catch ( error ) {
		this.remoteErrorStatus = ErrorStatus.notFound( "Unsupported connector for " + this.constructor.name + ": " + connectorName + '. ' + error ) ;
		return ;
	}

	//log.info( "URL: %Y\nConnector: %s" , this.parsedUrl , connectorName ) ;
	this.isInit = true ;
} ;



SharedObject.prototype.load = async function( recursiveDepth = 0 ) {
	var data ;

	this.init() ;

	if ( ! this.isLoaded ) {
		if ( this.postUrl ) {
			throw new Error( "Cannot load: it has not been POSTED yet" ) ;
		}

		log.debug( "About to GET a %s from %s" , this.constructor.name , this.url ) ;

		try {
			data = await this.connector.get( this.parsedUrl ) ;
			log.debug( "GOT a %s from %s -- raw data: %Y" , this.constructor.name , this.url , data ) ;
		}
		catch ( error ) {
			if ( error instanceof ErrorStatus ) {
				this.hasRemoteErrorStatus( error ) ;
				return ;
			}

			throw error ;

		}

		this.set( data ) ;

		this.isLoaded = true ;

		log.debug( "Has GOT a %s from %s\n>> after import: %Y" , this.constructor.name , this.url , this ) ;
	}

	if ( recursiveDepth ) {
		log.debug( "About to load recursively that %s" , this.constructor.name ) ;
		await this.recursiveLoad( this , recursiveDepth ) ;
		log.debug( "After loading recursively that %s: %Y" , this.constructor.name , this ) ;
	}
} ;



SharedObject.prototype.hasRemoteErrorStatus = function( errorStatus ) {
	this.remoteErrorStatus = errorStatus ;
} ;



SharedObject.prototype.reload = function( recursiveDepth = 0 ) {
	this.isLoaded = false ;
	return this.load( recursiveDepth ) ;
} ;



SharedObject.prototype.recursiveLoad = async function( object , depth ) {
	if ( ! object || typeof object !== 'object' ) { return ; }

	var keys , i , key , values , child ;

	if ( Array.isArray( object ) ) {
		values = object ;
	}
	else {
		keys = Object.keys( object ) ;
		values = Object.values( object ) ;
	}

	i = -1 ;
	for ( child of values ) {
		i ++ ;
		key = keys ? keys[ i ] : i ;

		if ( ! child || typeof child !== 'object' ) { continue ; }

		if ( ( child instanceof SharedObject ) && ! child.isLoaded ) {
			try {
				await child.load( depth - 1 ) ;
			}
			catch ( error ) {
				log.error( "Error loading child %s: %E" , child.constructor.name , error ) ;

				// Should repair the object (remove bad entry, and so on)
				// object.repair()

				throw error ;
			}
		}
		else {
			await this.recursiveLoad( child , depth ) ;	// not depth - 1, only effective loading count
		}
	}
} ;



SharedObject.prototype.save = async function() {
	var id ;

	this.init() ;

	if ( this.postUrl ) {
		log.debug( "About to POST a %s into %s" , this.constructor.name , this.postUrl ) ;
		id = await this.connector.post( this.parsedPostUrl , this.export() ) ;
		this.url = this.postUrl + '/' + id ;
		this.postUrl = null ;
		this.parsedPostUrl = null ;
		this.isInit = false ;
		log.debug( "Re init with %s" , this.url ) ;
		this.init() ;
		log.debug( "Has POST a %s to %s" , this.constructor.name , this.url ) ;
	}
	else {
		log.debug( "About to PUT a %s to %s" , this.constructor.name , this.url ) ;
		await this.connector.put( this.parsedUrl , this.export() ) ;
		log.debug( "Has PUT a %s to %s" , this.constructor.name , this.url ) ;
	}
} ;



SharedObject.prototype.delete = async function() {
	var id ;

	this.init() ;

	if ( this.postUrl ) {
		log.debug( "Not posted, nothing to do to DELETE a %s to %s" , this.constructor.name , this.url ) ;
	}
	else {
		log.debug( "About to DELETE a %s to %s" , this.constructor.name , this.url ) ;
		await this.connector.delete( this.parsedUrl ) ;
		log.debug( "Has DELETED a %s to %s" , this.constructor.name , this.url ) ;
	}
} ;

