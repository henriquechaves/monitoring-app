/*jshint esversion: 6 */

const chai = require('chai');

let expect = chai.expect;
let Monitoring = require('./monitoring');
let monitoring = new Monitoring();

describe('Request the "bairros" and get a 2 family', function() {
    it('status should be 2', function(done) {
        monitoring.doBairrosRequest(function(status) {
            expect(status).to.equal(2);
            done();
        });
    });
});

describe('Request the "bairros" and get a 4 family', function() {
    it('status should be 4', function(done) {
        monitoring.urlBairros = '/';

        monitoring.doBairrosRequest(function(status) {
            expect(status).to.equal(4);
            done();
        });
    });
});

describe('Request the "reinicia" and get a 501', function() {
    it('reponse status should be 501', function(done) {
        monitoring.doReiniciaRequest(function(status) {
            expect(status).to.equal(501);
            done();
        });
    });
});