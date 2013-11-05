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

		it('throws an Error if not properly constructed',function(done){			
			try{
				console.log(new RestApiModel.ResourceAction());
				done(new Error('expected error'));
			}catch(err){
				done();
			}
		});

		it('ensures path starts with a /',function(){
			var settings = {
				name : 'batchCreate',
				title : 'Create',
				method : 'POST',
				path : '_batch'
			};

			var action = new RestApiModel.ResourceAction(settings);

			console.log(JSON.stringify(action,undefined,2));
			expect(action.name).to.equal(settings.name);
			expect(action.title).to.equal(settings.title);
			expect(action.method).to.equal(settings.method);
			expect(action.path.charAt(0)).to.equal('/');
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

		it('throws an Error if not properly constructed',function(done){			
			try{
				console.log(new RestApiModel.Resource());
				done(new Error('expected error'));
			}catch(err){
				done();
			}
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

		it('#addAction',function(){
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

			resource.addAction({
				name : 'update',
				title : 'Udpate',
				method : 'PUT',
				payloadSchema : resourceSchema
			});

			expect(resource.action('update').name).to.equal('update');
		});

		it('#addAction - does not allow adding an action that already exists',function(done){
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

			resource.addAction({
				name : 'update',
				title : 'Udpate',
				method : 'PUT',
				payloadSchema : resourceSchema
			});

			expect(resource.action('update').name).to.equal('update');

			try{
				resource.addAction({
					name : 'update',
					title : 'Udpate',
					method : 'PUT',
					payloadSchema : resourceSchema
				});	
				done(new Error('expected Error'));
			}catch(err){
				console.log(err);
				done();
			}
			
		});

		it('#removeAction',function(){
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

			resource.removeAction('delete');

			expect(resource.action('delete')).to.equal(undefined);
		});

		it('#setAction',function(){
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

			resource.setAction({
				name : 'update',
				title : 'Udpate',
				method : 'PUT',
				payloadSchema : resourceSchema,
				auth : ['hawk']
			});

			expect(resource.action('update').auth[0]).to.equal('hawk');
		});

		it('#addLink',function(){
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

			resource.addLink({
				href : 'http://api.runrightfast.co/data/v1/object-schema-manager/objectSchemaNamespaces',
				title : 'Get the List of Object Schema Namespaces that are managed',
				rel : 'namespaces',
				auth: ['hawk'],				
			});

			expect(resource.link('namespaces').rel).to.equal('namespaces');	
		});

		it('#addLink - adding a link with the same rel is not allowed',function(done){
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

			expect(resource.link('config').rel).to.equal('config');	

			resource.addLink({
				href : 'http://api.runrightfast.co/data/v1/object-schema-manager/objectSchemaNamespaces',
				title : 'Get the List of Object Schema Namespaces that are managed',
				rel : 'namespaces',
				auth: ['hawk'],				
			});

			expect(resource.link('namespaces').rel).to.equal('namespaces');	

			try{
				resource.addLink({
					href : 'http://api.runrightfast.co/data/v1/object-schema-manager/objectSchemaNamespaces',
					title : 'Get the List of Object Schema Namespaces that are managed',
					rel : 'namespaces',
					auth: ['hawk'],				
				});
				done(new Error('expected Error'));
			}catch(err){
				console.log(err);
				done();
			}
		});

		it('#removeLink',function(){
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

			expect(resource.link('config').rel).to.equal('config');	
			resource.removeLink('config');
			expect(resource.link('config')).to.equal(undefined);	
		});

		it('#setLink',function(){
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

			expect(resource.link('config').rel).to.equal('config');	
			resource.setLink({
				href : 'http://api.runrightfast.co/data/v1/object-schema-manager/config',
				title : 'Object Schema Manager Configuration',
				rel : 'config',
				auth: ['hawk','oath'],				
			});
			console.log('after setLink(): ' + JSON.stringify(resource,undefined,2));
			expect(resource.link('config').auth[1]).to.equal('oath');	
		});

		it('#path',function(done){
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

			expect(resource.path('data','create')).to.equal('/data/v1/applications');
			expect(resource.path('data','delete')).to.equal('/data/v1/applications/{id}');

			try{
				resource.path('data','INVALID_ACTION_NAME');
			}catch(err){
				console.log(err);
				done();
			}

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

			var resourceNames = domain.resourceNames();
			expect(resourceNames.length).to.equal(1);
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

		it('#resourceHref',function(){
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
			console.log('domain = ' + JSON.stringify(domain,undefined,2));		
			var dataHref = domain.resourceHref({
				name : 'applications',
				version : 1,
				hrefType : 'data'
			});
			console.log('data href = ' + dataHref);
			expect(dataHref).to.equal('http://api.runrightfast.co/data/v1/applications');
		});

		it('#resourceHref - validates its args',function(done){
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
			try{
				console.log(domain.resourceHref({}));
				done(new Error('expected Error'));
			}catch(err){
				console.log(err);

				try{
					console.log(domain.resourceHref({
						name : 'applications-XXX',
						version : 1,
						hrefType : 'data'
					}));
					done(new Error('expected Error'));
				}catch(err2){
					console.log(err2);
					done();
				}
				
			}
		});

		it('#resourceDataHref, #resourceSchemaHref',function(){
			var resourceSchema = {
			 	namespace : 'ns://runrightfast.co/config',
			 	version : '1.1.1',
			 	type : 'ObjectSchemaManagerConfig'
			};

			var settings = {
				name : 'api.runrightfast.co',
				https : true,
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
			var href = domain.resourceDataHref({name:'applications',version:1});
			expect(href).to.equal('https://api.runrightfast.co/data/v1/applications');

			href = domain.resourceSchemaHref({name:'applications',version:1});
			expect(href).to.equal('https://api.runrightfast.co/schema/v1/applications');
			
		});

		it('#resourceLinkHref',function(){
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
			var href = domain.resourceLinkHref({
				name : 'applications',
				version : 1,
				linkPath : '{id}',
				queryString : {version: true},
				pathVariables : {id : '123'}
			});
			console.log('link href = ' + href);
			expect(href).to.equal('http://api.runrightfast.co/data/v1/applications/123?version=true');

			href = domain.resourceLinkHref({
				name : 'applications',
				version : 1,
				linkPath : '2',
				queryString : {version: false}
			});
			console.log('link href = ' + href);
			expect(href).to.equal('http://api.runrightfast.co/data/v1/applications/2?version=false');
		});

		it('#resourceLinkHref - validates its args',function(done){
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
			console.log('domain : ' + JSON.stringify(domain,undefined,2));
			var href;
			try{
				href = domain.resourceLinkHref({
					name : 'applicationsXXX',
					version : 1,
					linkPath : '{id}',
					queryString : {version: true},
					pathVariables : {id : '123'}
				});
				console.log('link href = ' + href);
				done(new Error('expected Error'));
			}catch(err){
				console.log(err);
				try{
					href = domain.resourceLinkHref({});
					console.log('link href = ' + href);
					done(new Error('expected Error'));
				}catch(err2){
					console.log(err2);
					done();
				}
			}

		});
	});

});