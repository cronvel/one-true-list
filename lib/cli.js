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



const Subscriber = require( './Subscriber.js' ) ;
const TerminalApp = require( './clients/terminal/App.js' ) ;
const homeConnector = require( './connectors/home.js' ) ;

const defaultConfig = require( './defaultConfig.js' ) ;

const path = require( 'path' ) ;
const os = require( 'os' ) ;
const fs = require( 'fs' ) ;
const fsKit = require( 'fs-kit' ) ;
const term = require( 'terminal-kit' ).terminal ;

require( './patches.js' ) ;

const cliManager = require( 'utterminal' ).cli ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;

const packageJson = require( '../package.json' ) ;
const appHomeDir = exports.homeDir = path.join( os.homedir() , '.local' , 'share' , packageJson.name ) ;



async function cli() {
	cliManager.package( packageJson )
		.helpOption
		.logOptions ;
	
	var args = cliManager.run() ;
	
	var config ,
		configPath = path.join( appHomeDir , 'config.json' ) ;

	await fsKit.ensurePathAsync( appHomeDir ) ;

	try {
		config = Object.assign( {} , defaultConfig , require( configPath ) ) ;
	}
	catch ( error ) {
		config = Object.assign( {} , defaultConfig ) ;
	}
	
	await cli.saveConfig( config , configPath ) ;
	
	config = cliManager.mergeConfig( args , config ) ;
	
	config.appHomeDir = appHomeDir ;

	var subscriber = new Subscriber( { url: config.subscriberUrl } ) ;
	
	try {
		await subscriber.load() ;
	}
	catch ( error ) {
		// Tmp?
		log.debug( "Create a default subscriber" ) ;
		await subscriber.save() ;
	}

	var ui = new TerminalApp( subscriber , config ) ;
	ui.start() ;
}

module.exports = cli ;



cli.saveConfig = function( config , configPath ) {
	return fs.writeFileAsync( configPath , JSON.stringify( config , null , '\t' ) ) ;
} ;

