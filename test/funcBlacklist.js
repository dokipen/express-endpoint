var blacklist = require('../lib/funcBlacklist')
  , should = require('should');

describe('funcBlacklist', function() {
  it('should include all types of bad func names', function(done) {
    blacklist['abstract'].should.be.true;
    blacklist['alert'].should.be.true;
    blacklist['onbeforeunload'].should.be.true;
    done();
  });
});
