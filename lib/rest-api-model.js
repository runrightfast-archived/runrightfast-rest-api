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

	var objectSchemaTypeSchema = {
		namespace : joi.types.String().regex(/ns:\/\/[\w\W]+/).required(),
		version : joi.types.String().regex(/\d+\.\d+\.\d+/).required(),
		type : joi.types.String().required()
	};

	var resourceActionSchema = {
		name : types.String().required(),
		title : types.String().required(),
		method : types.String().required().valid( 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'),
		auth : types.Array().includes(types.String()),
		requestQuerySchema : types.Object(objectSchemaTypeSchema),
		requestPayloadSchema : types.Object(objectSchemaTypeSchema),
		responseSchema : types.Object(objectSchemaTypeSchema),
		path : types.String()
	};

	var resourceSchema = {
		name : types.String().required(),
		version : types.Number().required().integer().min(1),
		objectSchemaType : types.Object(objectSchemaTypeSchema).required(),
		actions : types.Array(types.includes(types.Object(resourceActionSchema))),
		description : types.String(),
		tags : types.Array().includes(types.String()),
		notes : types.Array().includes(types.String())
	};

	var domainSchema = {
		name : types.String().required(),
		description : types.String(),		
		resources : types.Array().includes(types.Object(objectSchemaTypeSchema)).required(),
		https : types.Boolean(),
		port : types.Number().min(0)
	};

	var Domain = function Domain(domain){
		var err = joi.validate(domain,domainSchema);		
		if(err){
			throw err;
		}

		var checkForDuplicateResources = function checkForDuplicateResources(){
			// resource unique key is (name,version)
			var counts = lodash.countBy(domain.resources,function(resource){ 
				return resource.name + '/' + resource.version;
			});
			var dups = lodash.pick(counts,function(value){
				return value > 1;
			});
			var keys = lodash.keys(dups);
			assert(keys.length === 0,'resource name and version must be unique - duplicates: ' + keys);
		};
		
		checkForDuplicateResources();
		
		this.name = domain.name;
		this.resources = domain.resources;
		this.description = domain.description;
		this.https = !!domain.https;		
		this.port = domain.port;
	};

	var resourceHrefSchema = {
		name : types.String().required(),
		version : types.Number().required().integer().min(1),
		hrefType: types.String().required().valid('data','schema')
	};

	/**
		@param {String}name 	REQUIRED
		@param {Number}version  REQUIRED
		@return {Resource}		Returns the found resource, else undefined.
	*/
	Domain.prototype.resource = function(name,version){
		assert(lodash.isString(name),'name is required and must be a String');
		assert(lodash.isNumber(version),'version is required and must be a Number');
		return lodash.find(this.resources,{name:name,version:version});
	};

	/**	
		http(s)://{domain}:{port}/{hrefType}}/v{N}/{resource}

		<code>
		resource		REQUIRED - String - resource name
		version 		REQUIRED - Number - resource version
		hrefType		REQUIRED - String - valid values: ['data','schema']
		</code>
	*/
	Domain.prototype.resourceHref = function(params){
		params.hrefType = 'data';
		var err = joi.validate(params,resourceHrefSchema);
		if(err){
			throw err;
		}

		var resource = this.resource(params.name,params.version);
		if(!lodash.isObject(resource)){
			throw new Error('resource not found : ' + JSON.stringify(params));
		}

		var scheme = this.https ? 'http' : 'https';
		var port = lodash.isNumber(this.port) ? (':'+this.port) : '';		
		return scheme + '://' + this.domain + port + resource.path(params.hrefType);
	};

	/**	
		http(s)://{domain}:{port}/data/v{N}/{resource}

		<code>
		resource		REQUIRED - String - resource name
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
		resource		REQUIRED - String - resource name
		version 		REQUIRED - Number - resource version
		</code>
	*/
	Domain.prototype.resourceSchemaHref = function(params){
		assert(lodash.isObject(params),'params is required');
		params.hrefType = 'schema';
		return this.resourceHref(params);
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
		this.requestQuerySchema = action.requestQueryScehma;
		this.requestPayloadSchema = action.requestPayloadSchema;
		this.responseSchema = action.responseSchema;
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

		var dups,keys;
		if(lodash.isArray(resource.actions)){
			this.actions = resource.actions;	
			// check for duplicate actions - action unique key is (name)
			dups = lodash.pick(lodash.countBy(this.actions,'name'),function(value){
				return value > 1;
			});
			keys = lodash.keys(dups);
			assert(keys.length === 0,'action names must be unique - duplicates: ' + keys);
		}
		if(lodash.isArray(resource.links)){
			this.links = resource.links;	
			// check for duplicate links - links unique key is (rel)
			dups = lodash.pick(lodash.countBy(this.links,'rel'),function(value){
				return value > 1;
			});
			keys = lodash.keys(dups);
			assert(keys.length === 0,'link rels must be unique - duplicates: ' + keys);
		}
		if(lodash.isArray(resource.tags)){
			this.tags = resource.tags;	
		}
		if(lodash.isArray(resource.notes)){
			this.notes = resource.notes;
		}
	};

	/**
		@param {String}action 		REQUIRED - action name
		@return {ResourceAction}	Returns the found resource action, else undefined.
	*/
	Resource.prototype.action = function(action){
		assert(lodash.isString(action),'action is required');
		return lodash.find(this.actions,{name:action});
	};

	Resource.prototype.addAction = function(action){
		assert(lodash.isObject(action),'action is required and must be an Object');
		var newAction = new ResourceAction(action);
		if(lodash.find(this.actions,{name:action.name})){
			throw new Error('action already exists: ' + action.name);
		}

		this.actions.push(newAction);
	};

	/**
		@param {String}action REQUIRED - action name
	*/
	Resource.prototype.removeAction = function(action){
		assert(lodash.isString(action),'action is required and must be a String');
		this.actions = lodash.reject(this.actions,{name:action});
	};

	Resource.prototype.setAction = function(action){
		assert(lodash.isObject(action),'action is required and must be an Object');
		var newAction = new ResourceAction(action);
		var index = this.findIndex(this.actions,{name:action.name});
		if(index !== -1){
			this.actions[index] = newAction;
		}else{
			this.actions.push(newAction);
		}
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

	var resourceLinkSchema = {
		href : types.String().required(),
		rel :  types.String().required(),
		title :  types.String().required(),
		auth : types.Array().includes(types.String())
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
	};
	
	var restApiModel = {
		Resource : Resource,
		ResourceAction : ResourceAction,
		ResourceLink : ResourceLink
	};

	module.exports = restApiModel;
}());
