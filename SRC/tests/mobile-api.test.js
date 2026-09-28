import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeApiUrl,resolveApiUrl} from '../frontend/src/api-endpoint.js';

test('web and Android retain their development defaults',()=>{
 assert.equal(resolveApiUrl(),'/api');
 assert.equal(resolveApiUrl({configured:'/backend/api/'}),'/backend/api');
 assert.equal(resolveApiUrl({platform:'android'}),'http://10.0.2.2:3000/api');
 assert.equal(resolveApiUrl({stored:'http://192.168.1.2:3000'}),'http://192.168.1.2:3000/api');
});
test('connection settings reject credentials, query strings and unsafe protocols',()=>{
 for(const url of ['https://user:password@homefix.example.org','https://homefix.example.org?token=test','https://homefix.example.org/#section','file:///tmp/app','javascript:alert(1)'])assert.throws(()=>normalizeApiUrl(url));
});
