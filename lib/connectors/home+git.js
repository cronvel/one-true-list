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



const path = require( 'path' ) ;
const os = require( 'os' ) ;
const fs = require( 'fs' ) ;
const fsKit = require( 'fs-kit' ) ;
const execAsync = require( 'child_process' ).execAsync ;
const hash = require( 'hash-kit' ) ;
const string = require( 'string-kit' ) ;
const ErrorStatus = require( 'error-status' ) ;
const Promise = require( 'seventh' ) ;

const Logfella = require( 'logfella' ) ;
const log = Logfella.global.use( 'todo:home+git' ) ;

const packageJson = require( '../../package.json' ) ;
const homeDir = exports.homeDir = path.join( os.homedir() , '.local' , 'share' , packageJson.name , 'home+git' ) ;



exports.get = async function( parsedUrl ) {
	parseGitUrl( parsedUrl , '.json' ) ;

	if ( await isCloned( parsedUrl ) ) {
		await gitSyncGet( parsedUrl.gitRepoRemoteUrl , parsedUrl ) ;
	}
	else {
		await gitClone( parsedUrl ) ;
	}

	var data ,
		filePath = path.join( homeDir , parsedUrl.gitLocalPath ) ;

	try {
		data = JSON.parse( await fs.promises.readFile( filePath , 'utf8' ) ) ;
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
	parseGitUrl( parsedUrl , '.json' ) ;

	if ( ! await isCloned( parsedUrl ) ) {
		await gitClone( parsedUrl ) ;
	}

	var filePath = path.join( homeDir , parsedUrl.gitLocalPath ) ,
		fileDir = path.dirname( filePath ) ;

	await fsKit.ensurePath( fileDir ) ;
	await fs.promises.writeFile( filePath , JSON.stringify( data , null , '\t' ) ) ;

	gitSyncFull( parsedUrl.gitRepoRemoteUrl , parsedUrl , 'PUT ' + parsedUrl.gitPath , true ) ;
} ;



exports.post = async function( parsedUrl , data ) {
	var id = hash.uniqueId() ;

	parseGitUrl( parsedUrl , '.json' , id ) ;

	if ( ! await isCloned( parsedUrl ) ) {
		await gitClone( parsedUrl ) ;
	}

	var filePath = path.join( homeDir , parsedUrl.gitLocalPath ) ,
		fileDir = path.dirname( filePath ) ;

	await fsKit.ensurePath( fileDir ) ;
	await fs.promises.writeFile( filePath , JSON.stringify( data , null , '\t' ) ) ;

	gitSyncFull( parsedUrl.gitRepoRemoteUrl , parsedUrl , 'POST ' + parsedUrl.gitPath , true ) ;

	return id ;
} ;



exports.delete = async function( parsedUrl , data ) {
	parseGitUrl( parsedUrl , '.json' ) ;

	if ( ! await isCloned( parsedUrl ) ) {
		await gitClone( parsedUrl ) ;
	}

	var filePath = path.join( homeDir , parsedUrl.gitLocalPath ) ,
		relativeSubDir = parsedUrl.gitPath.replace( /\.json$/ , '' ) ,
		subDir = path.join( homeDir , relativeSubDir ) ;

	await gitRm( parsedUrl , relativeSubDir ) ;

	// Should be already lacally deleted by gitRm(), but ensure it is done anyway
	try {
		await fs.promises.unlink( filePath ) ;
		await fsKit.deltree( subDir ) ;
	}
	catch ( error ) {}

	gitSyncFull( parsedUrl.gitRepoRemoteUrl , parsedUrl , 'DELETE ' + parsedUrl.gitPath ) ;
} ;



// Helpers

function parseGitUrl( parsedUrl , extension , leafBasename ) {
	var pathname = parsedUrl.pathname ;

	if ( ! parsedUrl.host || ! parsedUrl.hostname ) {
		throw ErrorStatus.badRequest( 'Bad URL: missing host' ) ;
	}

	if ( pathname.match( /\.\./ ) ) {
		throw ErrorStatus.badRequest( 'Bad URL: should not contain any ../' ) ;
	}

	if ( leafBasename ) {
		if ( pathname[ pathname.length - 1 ] !== '/' ) { pathname += '/' ; }
		pathname += leafBasename ;
	}

	if ( extension ) {
		if ( pathname[ pathname.length - 1 ] === '/' ) { pathname = pathname.slice( 0 , pathname.length - 1 ) ; }
		pathname += extension ;
	}

	if ( parsedUrl.host === parsedUrl.hostname && pathname.startsWith( '/:' ) ) {
		parsedUrl.gitSshHost = true ;
		pathname = pathname.slice( 2 ) ;
	}

	[ parsedUrl.gitRepoRemotePath , parsedUrl.gitPath ] = pathname.split( '/:/' ) ;

	if ( ! parsedUrl.gitRepoRemotePath || ! parsedUrl.gitPath ) {
		throw ErrorStatus.badRequest( 'Bad URL: missing the git-url/local-path splitter' ) ;
	}

	// Strip initial slashes, because this MUST be relative path
	parsedUrl.gitPath = parsedUrl.gitPath.replace( /^\/+/ , '' ) ;

	if ( parsedUrl.gitSshHost ) {
		parsedUrl.gitRepoRemoteUrl = parsedUrl.host + ':' + parsedUrl.gitRepoRemotePath ;
		parsedUrl.gitRepoLocalPath = path.join( parsedUrl.host , parsedUrl.gitRepoRemotePath ) ;
	}
	else {
		parsedUrl.gitRepoRemoteUrl = parsedUrl.host + parsedUrl.gitRepoRemotePath ;
		parsedUrl.gitRepoLocalPath = path.join( parsedUrl.hostname , parsedUrl.gitRepoRemotePath ) ;
	}

	parsedUrl.gitLocalPath = path.join( parsedUrl.gitRepoLocalPath , parsedUrl.gitPath ) ;

	return parsedUrl ;
}



async function isCloned( parsedUrl ) {
	var stats ;

	try {
		stats = await fs.promises.stat( path.join( homeDir , parsedUrl.gitRepoLocalPath , '.git' ) ) ;
	}
	catch ( error ) {
		return false ;
	}

	return stats.isDirectory() ;
}



async function gitClone( parsedUrl ) {
	// First, ensure the parent directory
	await fsKit.ensurePath( path.dirname( path.join( homeDir , parsedUrl.gitRepoLocalPath ) ) ) ;

	var command = 'git clone ' ;
	command += string.escape.shellArg( parsedUrl.gitRepoRemoteUrl ) + ' ' ;
	command += string.escape.shellArg( path.join( homeDir , parsedUrl.gitRepoLocalPath ) ) ;

	try {
		await execAsync( command ) ;
	}
	catch ( error ) {
		log.error( "Git clone error -- command: %s -- %E\nparsedUrl: %Y" , command , error , parsedUrl ) ;
		throw error ;
	}
}



async function gitPull( parsedUrl ) {
	// First, we need to cd into the git repo directory
	var command = 'cd ' + string.escape.shellArg( path.join( homeDir , parsedUrl.gitRepoLocalPath ) ) + ' ; ' ;

	// Then, we exec the git commit command
	command += 'git pull' ;

	try {
		await execAsync( command ) ;
	}
	catch ( error ) {
		log.error( "Git pull error -- command: %s -- %E" , command , error ) ;
		throw error ;
	}
}



async function gitAdd( parsedUrl ) {
	// First, we need to cd into the git repo directory
	var command = 'cd ' + string.escape.shellArg( path.join( homeDir , parsedUrl.gitRepoLocalPath ) ) + ' ; ' ;

	// Then, we exec the git commit command
	command += 'git add ' + string.escape.shellArg( parsedUrl.gitPath ) ;

	try {
		await execAsync( command ) ;
	}
	catch ( error ) {
		if ( error.code === 128 && error.arg && error.arg.includes( ".git/index.lock': File exists" ) ) {
			await Promise.resolveTimeout( 200 ) ;
			return gitAdd( parsedUrl ) ;
		}

		log.error( "Git add error -- command: %s -- %E" , command , error ) ;
		throw error ;
	}
}



async function gitRm( parsedUrl , extraRelativeDirectory ) {
	// First, we need to cd into the git repo directory
	var command = 'cd ' + string.escape.shellArg( path.join( homeDir , parsedUrl.gitRepoLocalPath ) ) + ' ; ' ;

	// Then, we exec the git commit command
	command += 'git rm ' + string.escape.shellArg( parsedUrl.gitPath ) ;

	if ( extraRelativeDirectory ) {
		// Since we are not sure that it exists
		/*
		let stats = await fs.promises.stat( path.join( homeDir , parsedUrl.gitRepoLocalPath , extraRelativeDirectory ) ) ;
		if ( stats.isDirectory() ) {
			command += ' ; git rm -rf ' + string.escape.shellArg( extraRelativeDirectory ) ;
		}
		*/
		// We are not even sure it's versioned
		command += ' ; git rm -rf ' + string.escape.shellArg( extraRelativeDirectory ) + ' || true ' ;
	}

	try {
		await execAsync( command ) ;
	}
	catch ( error ) {
		if ( error.code === 128 && error.arg && error.arg.includes( ".git/index.lock': File exists" ) ) {
			await Promise.resolveTimeout( 200 ) ;
			return gitAdd( parsedUrl ) ;
		}

		log.error( "Git rm error -- command: %s -- %E" , command , error ) ;
		throw error ;
	}
}



async function gitCommit( parsedUrl , message = 'no message' ) {
	// First, we need to cd into the git repo directory
	var command = 'cd ' + string.escape.shellArg( path.join( homeDir , parsedUrl.gitRepoLocalPath ) ) + ' ; ' ;

	// Then, we exec the git commit command
	command += 'git commit -m ' + string.escape.shellArg( message ) ;

	try {
		await execAsync( command ) ;
		await Promise.resolveTimeout( 200 ) ;
	}
	catch ( error ) {
		if ( error.code === 1 && error.arg && error.arg.includes( 'nothing to commit' ) ) {
			return ;
		}
		if ( error.code === 128 && error.arg && error.arg.includes( ".git/index.lock': File exists" ) ) {
			await Promise.resolveTimeout( 200 ) ;
			return gitAdd( parsedUrl ) ;
		}

		log.error( "Git commit error -- command: %s -- %E\n>>> Stdout:\n%s\n" , command , error , error.arg ) ;
		throw error ;
	}
}



async function gitPush( parsedUrl ) {
	// First, we need to cd into the git repo directory
	var command = 'cd ' + string.escape.shellArg( path.join( homeDir , parsedUrl.gitRepoLocalPath ) ) + ' ; ' ;

	// Then, we exec the git commit command
	command += 'git push' ;

	try {
		await execAsync( command ) ;
	}
	catch ( error ) {
		if ( error.code === 128 && error.arg && error.arg.includes( ".git/index.lock': File exists" ) ) {
			await Promise.resolveTimeout( 200 ) ;
			return gitAdd( parsedUrl ) ;
		}

		log.error( "Git push error -- command: %s -- %E" , command , error ) ;
		throw error ;
	}
}



const [ gitSyncGet , gitSyncFull ] = Promise.debounceSync(
	{
		fn: ( resourceId , parsedUrl ) => gitPull( parsedUrl ) ,
		delay: 60 * 1000
	} ,
	{
		fn: async ( resourceId , parsedUrl , commitMessage , callGitAdd ) => {
			try {
				if ( callGitAdd ) { await gitAdd( parsedUrl ) ; }
				await gitCommit( parsedUrl , commitMessage ) ;
				await gitPull( parsedUrl ) ;
				await gitPush( parsedUrl ) ;
			}
			catch ( error ) {
				log.error( "Sync error: %E\nRetry in few ms" , error ) ;
				await Promise.resolveTimeout( 500 ) ;
				return gitSyncFull( resourceId , parsedUrl , commitMessage , callGitAdd ) ;
			}
		} ,
		delay: 5 * 1000
	}
) ;

