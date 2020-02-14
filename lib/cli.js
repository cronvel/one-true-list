/*
	One True List

	Copyright (c) 2019 - 2020 Cédric Ronvel

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
const execAsync = require( 'child_process' ).execAsync ;

const cliManager = require( 'utterminal' ).cli ;

const packageJson = require( '../package.json' ) ;
const appHomeDir = exports.homeDir = path.join( os.homedir() , '.local' , 'share' , packageJson.name ) ;
const logFilePath = path.join( appHomeDir , 'app.log' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo' ) ;



async function cli() {
	cliManager.package( packageJson )
		.helpOption
		.logOptions ;

	var args = cliManager.run() ;

	Logfella.global.installExitHandlers() ;
	Logfella.global.removeAllTransports() ;
	Logfella.global.addTransport( 'file' , { minLevel: 'trace' , color: true , path: logFilePath } ) ;

	var config ,
		configPath = path.join( appHomeDir , 'config.json' ) ;

	await fsKit.ensurePath( appHomeDir ) ;

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

	cli.npmInfo() ;

	try {
		await subscriber.load() ;
	}
	catch ( error ) {
		// Tmp?
		log.debug( "Create a default subscriber" ) ;
		await subscriber.save() ;
	}

	var ui = new TerminalApp( subscriber , config ) ;
	ui.start( cli.quit ) ;
}

module.exports = cli ;



cli.saveConfig = function( config , configPath ) {
	return fs.promises.writeFile( configPath , JSON.stringify( config , null , '\t' ) ) ;
} ;



var npmInfo = null ;

cli.npmInfo = async function() {
	try {
		npmInfo = JSON.parse( await execAsync( "npm info " + packageJson.name + " --json" ) ) ;
	}
	catch ( error ) {
		npmInfo = error ;
	}
} ;



cli.quit = async function() {
	if ( npmInfo ) {
		if ( npmInfo instanceof Error ) {
			//log.fatal( "Command npm info failed: %E\n" , npmInfo ) ;
			term( "\n^-Npm info failed, can't check the latest version of %s.\n" , packageJson.name ) ;
		}
		else if ( npmInfo['dist-tags'] && npmInfo['dist-tags'].latest && npmInfo['dist-tags'].latest !== packageJson.version ) {
			term( "\n\n^YA new version of ^/^c%s^ ^Yexists! ^+YOU SHALL INSTALL IT!^:\n  Current version: %s\n  New version: %s\n\n" , packageJson.name , packageJson.version , npmInfo['dist-tags'].latest ) ;
		}
	}
} ;

