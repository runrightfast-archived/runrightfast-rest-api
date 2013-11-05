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
'use strict';

var expect = require('chai').expect;
var lodash = require('lodash');
var RestApiModel = require('..').RestApiModel;

describe('RestApiModel', function() {

	it('testing lodash.chain',function(){

		var obj = {
			a1: {a:1},
			a2: {a:2}
		};
		lodash.chain(obj)
			.keys()
			.forEach(function(key){
				console.log(key + ' -> ' + JSON.stringify(obj[key]));
			});

	});
	
	describe('ResourceLink',function(){
		it('must be constructed with an href, title, and rel',function(){
			var settings = {
				href : 'http://api.runrightfast.co/data/v1/applications/object-schema-manager/1.0.0/config',
				title : 'Object Schema Manager Configuration',
				rel : 'config',
				auth: ['hawk']
			};
			var resourceLink = new RestApiModel.ResourceLink(settings);

			console.log(JSON.stringify(resourceLink,undefined,2));

			expect(resourceLink.href).to.equal(settings.href);
			expect(resourceLink.title).to.equal(settings.title);
			expect(resourceLink.rel).to.equal(settings.rel);
			expect(resourceLink.auth).to.equal(settings.auth);
		});

		it('throws an Error if not properly constructed',function(done){			
			try{
				console.log(new RestApiModel.ResourceLink());
				done(new Error('expected error'));
			}catch(err){
				done();
			}
		});
	});

	describe('ResourceAction',function(){
		it('must be constructed with name, title, method',function(){
			var settings = {
				name : 'create',
				title : 'Create',
				method : 'POST'
			};

			var action = new RestApiModel.ResourceAction(settings);

			console.log(JSON.stringify(action,undefined,2));
			expect(action.name).to.equal(settings.name);
			expect(action.title).to.equal(settings.title);
			expect(action.method).to.equal(settings.method);
		});
	});

	describe('Resource',function(){
		it('can be constructed with no actions and no links',function(){
			var settings = {
				name : 'applications',
				version : 1,
				objectSchemaType: {
					namespace : 'ns://runrightfast.co/applications',
					version : '1.0.0',
					type : 'Application'
				},
				description : 'Applications',
				tags : ['app']
			};

			var resource = new RestApiModel.Resource(settings);

			console.log(JSON.stringify(resource,undefined,2));
		});

		it('can be constructed with actions',function(){
			var resourceSchema = {
			 	namespace : 'ns://runrightfast.co/config',
			 	version : '1.1.1',
			 	type : 'ObjectSchemaManagerConfig'
			};

			var settings = {
				name : 'applications',
				version : 1,
				objectSchemaType: {
					namespace : 'ns://runrightfast.co/applications',
					version : '1.0.0',
					type : 'Application'
				},
				description : 'Applications',
				tags : ['app'],
				actions :[
					{
						name : 'create',
						 title : 'Create',
						 method : 'POST',
						 payloadSchema : resourceSchema
					},
					{
						name : 'delete',
					 	title : 'Delete',
					 	method : 'DELETE',
					 	path : '/{id}'
					 }
				]
			};

			var resource = new RestApiModel.Resource(settings);
			console.log(JSON.stringify(resource,undefined,2));

			expect(resource.action('create').name).to.equal('create');
			expect(resource.action('delete').name).to.equal('delete');
		});

		it('can be constructed with links',function(){
			var resourceSchema = {
			 	namespace : 'ns://runrightfast.co/config',
			 	version : '1.1.1',
			 	type : 'ObjectSchemaManagerConfig'
			};

			var settings = {
				name : 'applications',
				version : 1,
				objectSchemaType: {
					namespace : 'ns://runrightfast.co/applications',
					version : '1.0.0',
					type : 'Application'
				},
				description : 'Applications',
				tags : ['app'],
				actions :[
					{
						name : 'create',
						 title : 'Create',
						 method : 'POST',
						 payloadSchema : resourceSchema
					},
					{
						name : 'delete',
					 	title : 'Delete',
					 	method : 'DELETE',
					 	path : '/{id}'
					 }
				],
				links: [
					{
						href : 'http://api.runrightfast.co/data/v1/object-schema-manager/config',
						title : 'Object Schema Manager Configuration',
						rel : 'config',
						auth: ['hawk'],				
					}
				]
			};

			var resource = new RestApiModel.Resource(settings);
			console.log(JSON.stringify(resource,undefined,2));

			expect(resource.action('create').name).to.equal('create');
			expect(resource.action('delete').name).to.equal('delete');
			expect(resource.link('config').rel).to.equal('config');			
		});
	});

	describe('Domain',function(){
		it('must be constructed with a name and resources',function(){
			var resourceSchema = {
			 	namespace : 'ns://runrightfast.co/config',
			 	version : '1.1.1',
			 	type : 'ObjectSchemaManagerConfig'
			};

			var settings = {
				name : 'api.runrightfast.co',
				resources : [
					{
						name : 'applications',
						version : 1,
						objectSchemaType: {
							namespace : 'ns://runrightfast.co/applications',
							version : '1.0.0',
							type : 'Application'
						},
						description : 'Applications',
						tags : ['app'],
						actions :[
							{
								name : 'create',
								 title : 'Create',
								 method : 'POST',
								 payloadSchema : resourceSchema
							},
							{
								name : 'delete',
							 	title : 'Delete',
							 	method : 'DELETE',
							 	path : '/{id}'
							 }
						],
						links: [
							{
								href : 'http://api.runrightfast.co/data/v1/object-schema-manager/config',
								title : 'Object Schema Manager Configuration',
								rel : 'config',
								auth: ['hawk'],				
							}
						]
					}
				]
			};

			var domain = new RestApiModel.Domain(settings);

			console.log(JSON.stringify(domain,undefined,2));
			expect(domain.resource('applications',1).name).to.equal('applications');
		});

		it('if constructed with invalid settings, then an Error is thrown',function(done){
			try{
				console.log(new RestApiModel.Domain());
				done(new Error('expected error'));
			}catch(err){
				console.log(err);
				done();
			}
		});
	});

});