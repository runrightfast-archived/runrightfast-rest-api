/**
 * Copyright [2013] [runrightfast.co]
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

/**
 * <code>
 * host 			REQUIRED 
 * port 			REQUIRED 
 * </code>
 */
(function() {
	'use strict';

	var joi = require('joi');
	var types = joi.types;
	var lodash = require('lodash');
	var hoek = require('hoek');
	var assert = hoek.assert;
	var querystring = require('querystring');

	var objectSchemaTypeSchema = {
		namespace : joi.types.String().regex(/ns:\/\/[\w\W]+/).required(),
		version : joi.types.String().regex(/\d+\.\d+\.\d+/).required(),
		type : joi.types.String().required()
	};

	var resourceLinkSchema = {
		href : types.String().required(),
		rel :  types.String().required(),
		title :  types.String().required(),
		auth : types.Array().includes(types.String()),
		queryStringSchema : types.Object(objectSchemaTypeSchema),
	};

	var resourceActionSchema = {
		name : types.String().required(),
		title : types.String().required(),
		method : types.String().required().valid( 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'),
		auth : types.Array().includes(types.String()),
		queryStringSchema : types.Object(objectSchemaTypeSchema),
		payloadSchema : types.Object(objectSchemaTypeSchema),
		responseSchema : types.Object(objectSchemaTypeSchema),
		path : types.String()
	};

	var resourceSchema = {
		name : types.String().required(),
		version : types.Number().required().integer().min(1),
		objectSchemaType : types.Object(objectSchemaTypeSchema),
		actions : types.Array().includes(types.Object(resourceActionSchema)),
		links : types.Array().includes(types.Object(resourceLinkSchema)),
		description : types.String(),
		tags : types.Array().includes(types.String())
	};

	var domainSchema = {
		name : types.String().required(),
		description : types.String(),		
		resources : types.Array().includes(types.Object(resourceSchema)).required(),
		https : types.Boolean(),
		port : types.Number().min(0)
	};

	var toResourceKey = function(name,version){
		assert(lodash.isString(name),'name is required and must be a String');
		assert(lodash.isNumber(version),'version is required and must be a Number');
		return name + '/' + version;
	};

	var getResourceKey = function(resource){
		assert(lodash.isObject(resource),'resource is required and must be an object');
		return toResourceKey(resource.name,resource.version);
	};

	var ResourceAction = function ResourceAction(action){
		var err = joi.validate(action,resourceActionSchema);
		if(err){
			throw err;
		}
		this.name = action.name;		
		this.title = action.title;
		this.method = action.method;
		this.path = action.path || '';
		if(this.path.length > 0 && this.path.charAt(0) !== '/'){
			this.path = '/' + this.path;
		}
		this.auth = action.auth;
		this.queryStringSchema = action.requestQueryScehma;
		this.payloadSchema = action.payloadSchema;
		this.responseSchema = action.responseSchema;
	};

	var ResourceLink = function ResourceLink(link){
		var err = joi.validate(link,resourceLinkSchema);
		if(err){
			throw err;
		}

		this.href = link.href;
		this.rel = link.rel;
		this.title = link.title;
		this.auth = link.auth;
		this.queryStringSchema = link.queryStringSchema;
	};

	var Resource = function Resource(resource){
		var err = joi.validate(resource,resourceSchema);
		if(err){
			throw err;
		}
		this.name = resource.name;		
		this.version = resource.version;
		this.objectSchemaType = resource.objectSchemaType;
		
		if(lodash.isString(resource.description)){
			this.description = resource.description;	
		}

		var keys,values;
		if(lodash.isArray(resource.actions)){
			keys = lodash.pluck(resource.actions,'name');
			values = lodash.map(resource.actions,function(action){
				return new ResourceAction(action);
			});
			this.actions = lodash.zipObject(keys,values);
			// check for duplicate actions - actions unique key is (name)
			assert(lodash.keys(this.actions).length === resource.actions.length,'action names must be unique - duplicates: ' + 
				lodash.chain(resource.actions)
					.countBy('name')
					.omit(function(value){ return value === 1;})
					.keys()
					.value());

		}
		if(lodash.isArray(resource.links)){
			keys = lodash.pluck(resource.links,'rel');
			values = lodash.map(resource.links,function(link){
				return new ResourceLink(link);
			});
			this.links = lodash.zipObject(keys,values);
			// check for duplicate links - links unique key is (rel)
			assert(lodash.keys(this.links).length === resource.links.length,"links 'rel' must be unique - duplicates: " + 
				lodash.chain(resource.links)
					.countBy('rel')
					.omit(function(value){ return value === 1;})
					.keys()
					.value());
		}
		if(lodash.isArray(resource.tags)){
			this.tags = resource.tags;	
		}		
	};

	/**
		@param {String}action 		REQUIRED - action name
		@return {ResourceAction}	Returns the found resource action, else undefined.
	*/
	Resource.prototype.action = function(action){
		assert(lodash.isString(action),'action is required');
		return this.actions[action];
	};

	Resource.prototype.addAction = function(action){
		assert(lodash.isObject(action),'action is required and must be an Object');
		var newAction = new ResourceAction(action);
		if(this.actions[newAction.name]){
			throw new Error('action already exists: ' + newAction.name);
		}

		this.actions[newAction.name] = newAction;
	};

	/**
		@param {String}action REQUIRED - action name
	*/
	Resource.prototype.removeAction = function(action){
		assert(lodash.isString(action),'action is required and must be a String');
		delete this.actions[action];
	};

	Resource.prototype.setAction = function(action){
		assert(lodash.isObject(action),'action is required and must be an Object');
		var newAction = new ResourceAction(action);
		this.actions[newAction.name] = newAction;
	};

	/**
		@param {String}rel 		REQUIRED - rel name
		@return {ResourceLink}	Returns the found resource link, else undefined.
	*/
	Resource.prototype.link = function(rel){
		assert(lodash.isString(rel),'rel is required');
		return this.links[rel];
	};

	Resource.prototype.addLink = function(link){
		assert(lodash.isObject(link),'link is required and must be an Object');
		var newLink = new ResourceLink(link);
		if(this.links[newLink.rel]){
			throw new Error('link already exists: ' + newLink.rel);
		}

		this.links[newLink.rel] = newLink;
	};

	/**
		@param {String}action REQUIRED - action name
	*/
	Resource.prototype.removeLink = function(rel){
		assert(lodash.isString(rel),'rel is required and must be a String');
		delete this.links[rel];
	};

	Resource.prototype.setLink = function(link){
		assert(lodash.isObject(link),'link is required and must be an Object');
		var newLink = new ResourceLink(link);
		this.links[newLink.rel] = newLink;
	};

	/**
		/v{resource.version}/{resource.name}
	*/
	Resource.prototype.path = function(hrefType,action){
		assert(lodash.isString(hrefType),'hrefType is required');
		var path = '/' + hrefType +'/v' + this.version + '/' + this.name;
		if(lodash.isString(action)){
			var resourceAction = this.action(action);
			if(!resourceAction){
				throw new Error('invalid action: ' + action);
			}
			path += resourceAction.path;
		}
		return path;
	};	

	var Domain = function Domain(domain){
		var err = joi.validate(domain,domainSchema);		
		if(err){
			throw err;
		}

		var keys = lodash.map(domain.resources,getResourceKey);		
		var values = lodash.map(domain.resources,function(resource) {return new Resource(resource);});
		this.resources = lodash.zipObject(keys,values);		
		assert(lodash.keys(this.resources).length === domain.resources.length,
			'duplicate resource keys were found - name/resource.version is the resource key: ' +
			 	lodash.chain(domain.resources)
				    .countBy(getResourceKey)
				    .omit(function(value){return value === 1;})
				    .keys()
				    .value());
		
		this.name = domain.name;		
		this.description = domain.description;
		this.https = !!domain.https;		
		this.port = domain.port;
	};

	var resourceHrefSchema = {
		name : types.String().required(),
		version : types.Number().required().integer().min(1),
		hrefType: types.String().valid('data','schema','service')
	};

	/**
		@param {String}name 	REQUIRED
		@param {Number}version  REQUIRED
		@return {Resource}		Returns the found resource, else undefined.
	*/
	Domain.prototype.resource = function(name,version){		
		return this.resources[toResourceKey(name,version)];
	};

	Domain.prototype.resourceNames = function(){
		return lodash.keys(this.resources) || [];
	};

	/**	
		http(s)://{domain}:{port}/{hrefType}}/v{N}/{resource}

		<code>
		name 			REQUIRED - String - resource name
		version 		REQUIRED - Number - resource version
		hrefType		REQUIRED - String - valid values: ['data','schema','service']
		</code>
	*/
	Domain.prototype.resourceHref = function(params){
		assert(lodash.isObject(params),'params is required and it must be an Object');
		if(!params.hrefType){
			params.hrefType = 'data';
		}	
		var err = joi.validate(params,resourceHrefSchema);
		if(err){
			throw err;
		}

		var resource = this.resource(params.name,params.version);
		if(!lodash.isObject(resource)){
			throw new Error('resource not found : ' + JSON.stringify(params));
		}

		var scheme = this.https ? 'https' : 'http';
		var port = lodash.isNumber(this.port) ? (':'+this.port) : '';		
		return scheme + '://' + this.name + port + resource.path(params.hrefType);
	};

	var resourceLinkHrefSchema = {
		name : types.String().required(),
		version : types.Number().required().integer().min(1),
		linkPath: types.String().required(),
		queryString : types.Object(),
		pathVariables : types.Object(),
		hrefType: types.String().valid('data','schema','service')
	};

	/**	
		The purpose of this method is to help construct URLs for ResourceLink.href.

		http(s)://{domain}:{port}/data/v{N}/{resource}/{linkPath}?{queryString}

		<code>
		name 			REQUIRED - String - resource name
		version 		REQUIRED - Number - resource version
		linkPath		REQUIRED - String
		queryString		OPTIONAL - Object - converted to a query string,
		pathVariables	OPTIONAL - Object - used to substitute path variables
		</code>
	*/
	Domain.prototype.resourceLinkHref = function(params){
		assert(lodash.isObject(params),'params is required and must be an Object');
		params.hrefType = 'data';
		var err = joi.validate(params,resourceLinkHrefSchema);
		if(err){
			throw err;
		}

		var resource = this.resource(params.name,params.version);
		if(!lodash.isObject(resource)){
			throw new Error('resource not found : ' + JSON.stringify(params));
		}

		var scheme = this.https ? 'https' : 'http';
		var port = lodash.isNumber(this.port) ? (':'+this.port) : '';		
		var href = scheme + '://' + this.name + port + resource.path(params.hrefType);
		if(params.linkPath){
			var linkPath = (params.linkPath.charAt(0) === '/') ?  params.linkPath : ('/' + params.linkPath);
			href += linkPath;
		}
		if(params.queryString){
			href += '?' + querystring.stringify(params.queryString);
		}

		if(params.pathVariables){
			return lodash.chain(params.pathVariables)
					.keys()
					.foldl(function(href,pathVariable){				
						return href.replace('{'+pathVariable+'}',params.pathVariables[pathVariable]);
					},href)
					.value();
		}
		return href;
	};

	/**	
		http(s)://{domain}:{port}/data/v{N}/{resource}

		<code>
		name 			REQUIRED - String - resource name
		version 		REQUIRED - Number - resource version
		</code>
	*/
	Domain.prototype.resourceDataHref = function(params){
		assert(lodash.isObject(params),'params is required');
		params.hrefType = 'data';
		return this.resourceHref(params);
	};

	/**	
		http(s)://{domain}:{port}/schema/v{N}/{resource}

		<code>
		name			REQUIRED - String - resource name
		version 		REQUIRED - Number - resource version
		</code>
	*/
	Domain.prototype.resourceSchemaHref = function(params){
		assert(lodash.isObject(params),'params is required');
		params.hrefType = 'schema';
		return this.resourceHref(params);
	};

	
	
	var RestApiModel = {
		Resource : Resource,
		ResourceAction : ResourceAction,
		ResourceLink : ResourceLink,
		Domain : Domain
	};

	module.exports = RestApiModel;
}());
