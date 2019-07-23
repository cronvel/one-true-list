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
const os = require( 'os' ) ;
const fs = require( 'fs' ) ;
const fsKit = require( 'fs-kit' ) ;
const hash = require( 'hash-kit' ) ;
const ErrorStatus = require( 'error-status' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo:home' ) ;

const packageJson = require( '../../package.json' ) ;
const homeDir = exports.homeDir = path.join( os.homedir() , '.local' , 'share' , packageJson.name , 'home' ) ;



exports.get = async function( parsedUrl ) {
	var data ,
		filePath = path.join( homeDir , parsedUrl.path ) + '.json' ;

	try {
		data = JSON.parse( await fs.readFileAsync( filePath , 'utf8' ) ) ;
	}
	catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			throw ErrorStatus.notFound( "File " + filePath + " not found" ) ;
		}

		throw error ;
	}

	return data ;
} ;



exports.put = async function( parsedUrl , data ) {
	var filePath = path.join( homeDir , parsedUrl.path ) + '.json' ,
		fileDir = path.dirname( filePath ) ;

	await fsKit.ensurePathAsync( fileDir ) ;
	await fs.writeFileAsync( filePath , JSON.stringify( data , null , '\t' ) ) ;
} ;



exports.post = async function( parsedUrl , data ) {
	var fileDir = path.join( homeDir , parsedUrl.path ) ,
		id = hash.uniqueId() ,
		filePath = path.join( fileDir , id ) + '.json' ;

	await fsKit.ensurePathAsync( fileDir ) ;
	await fs.writeFileAsync( filePath , JSON.stringify( data , null , '\t' ) ) ;

	return id ;
} ;



exports.delete = async function( parsedUrl , data ) {
	var filePath = path.join( homeDir , parsedUrl.path ) + '.json' ,
		fileDir = path.join( homeDir , parsedUrl.path ) ;

	await fs.unlinkAsync( filePath ) ;
	await fsKit.deltreeAsync( fileDir ) ;
} ;

