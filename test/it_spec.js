
/*global it, describe, beforeEach*/
var expect = require('chai').expect
var It = require('../it')


function dbl(x) {
  return x + x
}

describe('It', function() {

  function getArgs() {
    return [].slice.call(arguments)
  }

  var a = {
        a: 1,
        b: { c: 2 }
      },
      b = {
        a: 'this is a test',
        z: 'test',
        lol: function() {
          return this.a
        }
      },
      c = {
        a: null,
        t: true,
        f: false,
        getContext: function() { return this },
        getArgs: getArgs
      },
      d = {
        allTheStuff: [a, b, c]
      }

  it('should act as an identity function', function() {
    expect(It('hello world')).to.equal('hello world')
  })

  describe('.get', function() {
    it('should get the value of an object', function() {
      expect(It.get('a')(a)).to.equal(a.a)
      expect(It.get('b')(a)).to.equal(a.b)
      expect(It.get('a')(b)).to.equal(b.a)
    })
    it('should be chainable', function() {
      expect(It.get('b').get('c')(a)).to.equal(a.b.c)
    })
  })

  describe('.send / .invoke', function() {
    it('should call a method', function() {
      expect(It.get('a').send('toUpperCase')(b)).to.equal('THIS IS A TEST')
      expect(It.get('a').invoke('toUpperCase')(b)).to.equal('THIS IS A TEST')
    })
    it('should also accept a function', function() {
      expect(It.get('a').send(''.toUpperCase)(b)).to.equal('THIS IS A TEST')
    })
    it('should call a method with one parameter', function() {
      expect(It.send('toString', 36)(1296)).to.equal('100')
    })
    it('should call a method with multiple parameters', function() {
      expect(It.send('getArgs')(c)).to.deep.equal([])
      expect(It.send('getArgs', 55555)(c)).to.deep.equal([55555])
      expect(It.send('getArgs', 'w', 't', 'f')(c)).to.deep.equal(['w', 't', 'f'])
    })
    it('should call a method with multiple parameters and accept a function', function() {
      var getArgs = c.getArgs
      expect(It.send(getArgs)(c)).to.deep.equal([])
      expect(It.send(getArgs, 55555)(c)).to.deep.equal([55555])
      expect(It.send(getArgs, 'w', 't', 'f')(c)).to.deep.equal(['w', 't', 'f'])
    })
  })

  describe('.post', function() {
    it('should apply arguments to methods', function() {
      expect(It.post('getArgs', [])(c)).to.deep.equal([])
      expect(It.post('getArgs', [3])(c)).to.deep.equal([3])
      expect(It.post('getArgs', [2, 3])(c)).to.deep.equal([2, 3])
      expect(It.post('getArgs', [1, 2, 3])(c)).to.deep.equal([1, 2, 3])
    })
    it('should preserve context', function() {
      expect(It.post('getContext', [1, 2, 3])(c)).to.equal(c)
    })
  })


  describe('.set / .put', function() {
    var object
    beforeEach(function() {
      object = { a: 1, b: 2, c: 3 }
    })
    it('should set the property', function() {
      It.set('a', 555)(object)
      It.put('b', 777)(object)
      expect(object.a).to.equal(555)
      expect(object.b).to.equal(777)
    })
    it('should return the object', function() {
      expect(It.set('a', 555)(object)).to.equal(object)
      expect(It.put('b', 777)(object)).to.equal(object)
    })
  })

  describe('.del', function() {
    var object
    beforeEach(function() {
      object = { a: 1, b: 2, c: 3 }
    })
    it('should set the property', function() {
      It.del('a')(object)
      It(expect(object.a).not.to.be.ok)
    })
    it('should return the object', function() {
      expect(It.del('a')(object)).to.equal(object)
    })
  })

  describe('.maybe', function() {
    it('should just return if it\'s falsy', function() {
      expect(It.maybe(It.get('a'))(null)).to.equal(null)
      expect(It.maybe(It.get('a'))(false)).to.equal(false)
      expect(It.maybe(It.send('wtf'))(false)).to.equal(false)
      It(expect(It.get('z').maybe(It.get('length'))(a)).not.to.be.ok)
    })
    it('should run the function if it\'s truthy', function() {
      expect(It.maybe(It.get('a'))({ a: 1 })).to.equal(1)
      expect(It.get('z').maybe(It.get('length'))(b)).to.equal(4)
    })
    it('should accept string instead of function', function() {
      var bc = It.maybe('b').maybe('c')
      expect(bc(a)).to.equal(2)
      expect(bc(b)).to.equal(undefined)
      expect(bc(c)).to.equal(undefined)
    })
  })

  describe('.or', function() {
    it('should return the passed value if it\'s falsy', function() {
      expect(It.or(1)(0)).to.equal(1)
      expect(It.or(false)(0)).to.equal(false)
    })
    it('should return the invoked value if it\'s truthy', function() {
      expect(It.or(1)(444)).to.equal(444)
    })
  })

  describe('.instantiate', function() {
    function Value(x) {
      this.value = x
    }
    it('should turn things into instances', function() {
      var a = [1, 2, 'hello']
      var z = a.map(It.instantiate(Value))
      expect(z[0]).to.be.an.instanceOf(Value)
      expect(z[1]).to.be.an.instanceOf(Value)
      expect(z[2]).to.be.an.instanceOf(Value)
      expect(z[0].value).to.equal(1)
      expect(z[1].value).to.equal(2)
      expect(z[2].value).to.equal('hello')
    })
  })

  describe('.tap', function() {
    it('should run the function, and return self', function() {
      var obj = { a: 1 }
      expect(It.tap(It.set('a', 555))(obj)).to.equal(obj)
      expect(obj.a).to.equal(555)
      expect(It.tap(It.set('a', 1234)).get('a')(obj)).to.equal(1234)
    })
  })

  describe('.self', function() {
    it('should use the context instead of passed argument', function() {
      expect(It.self.call(a)).to.equal(a)
      expect(It.self.get('a').call(a)).to.equal(1)
      expect(It.self.get('b').get('c').call(a)).to.equal(2)
      expect(It.self.send('getContext').call(c)).to.equal(c)
    })
  })

  describe('.fapply', function() {
    it('should apply arguments to methods', function() {
      expect(It.fapply([])(getArgs)).to.deep.equal([])
      expect(It.fapply([3])(getArgs)).to.deep.equal([3])
      expect(It.fapply([2, 3])(getArgs)).to.deep.equal([2, 3])
      expect(It.fapply([1, 2, 3])(getArgs)).to.deep.equal([1, 2, 3])
    })
  })

  describe('.fcall', function() {
    it('should apply arguments to methods', function() {
      expect(It.fcall()(getArgs)).to.deep.equal([])
      expect(It.fcall(3)(getArgs)).to.deep.equal([3])
      expect(It.fcall(2, 3)(getArgs)).to.deep.equal([2, 3])
      expect(It.fcall(1, 2, 3)(getArgs)).to.deep.equal([1, 2, 3])
    })
  })

  describe('.not', function() {
    it('should return boolean negative of passed function argument', function() {
      expect(It.not(It)(1)).to.equal(false)
      expect(It.not(It)(0)).to.equal(true)
    })
    it('should use identity function when none is supplied', function() {
      expect(It.not()(1)).to.equal(false)
      expect(It.not()(0)).to.equal(true)
    })
    it('should be chainable', function() {
      expect(It.not(It.get('t'))(c)).to.equal(false)
      expect(It.not(It.get('f'))(c)).to.equal(true)
      expect(It.get('t').not()(c)).to.equal(false)
      expect(It.get('f').not()(c)).to.equal(true)
    })
    it('should accept strings', function() {
      expect(It.not('t')(c)).to.equal(false)
      expect(It.not('f')(c)).to.equal(true)
    })
    it('should work with .self (that is, preserves context)', function() {
      expect(It.self.not(It.get('t')).call(c)).to.equal(false)
      expect(It.self.not(It.get('f')).call(c)).to.equal(true)
      expect(It.self.get('t').not().call(c)).to.equal(false)
      expect(It.self.get('f').not().call(c)).to.equal(true)
    })
  })

  describe('.splat', function() {
    it('should map on a function', function() {
      expect(It.splat(dbl)([1,2,3,4])).to.deep.equal([2,4,6,8])
      expect(It.get('x').splat(dbl)({x: [1,2,3,4]})).to.deep.equal([2,4,6,8])
    })
    it('should accept string instead of function', function() {
      expect(It.get('allTheStuff').splat('a')(d)).to.deep.equal([1, 'this is a test', null])
    })
  })

  describe('.pluck', function() {
    it('should splat with get', function() {
      expect(It.get('allTheStuff').pluck('a')(d)).to.deep.equal([1, 'this is a test', null])
    })
  })

  describe("['===']", function() {
    it('should return true only when it\'s strictly equal', function() {
      var one = It['==='](1)
      expect(one(1)).to.equal(true)
      expect(one('1')).to.equal(false)
    })
  })
  describe("['==']", function() {
    it('should return true only when it\'s equal', function() {
      var one = It['=='](1)
      expect(one(1)).to.equal(true)
      expect(one('1')).to.equal(true)
      expect(one('2')).to.equal(false)
    })
  })

  // just getting tired of typing things
  var F = false, T = true

  describe('operators', function() {

    function describeOperator(operator, result) {
      describe(operator, function() {
        it('should compute value of a ' + operator + ' b', function() {
          /*jshint evil:true*/
          expect(It[operator](1,2)).to.equal(eval('1' + operator + '2'))
        })
        it('should return value of it ' + operator + ' passed value', function() {
          expect(It.splat(It[operator](2))([1,2,3,4])).to.deep.equal(result)
        })
      })
    }

    describeOperator('>', [ F, F, T, T ])
    describeOperator('>=', [ F, T, T, T ])
    describeOperator('<', [ T, F, F, F ])
    describeOperator('<=', [ T, T, F, F ])
    describeOperator('!=', [ T, F, T, T ])
    describeOperator('!==', [ T, F, T, T ])
    describeOperator('+', [ 3, 4, 5, 6 ])
    describeOperator('-', [ -1, 0, 1, 2 ])
    describeOperator('*', [ 2, 4, 6, 8 ])
    describeOperator('/', [ 0.5, 1, 1.5, 2 ])

  })
  
  describe('.reduce', function() {
    it('should do a reduce on an array', function() {
      var sum = It.reduce(It.op['+'])
      expect(sum([1,2,3,4])).to.equal(10)
    })
  })
  describe('.filter', function() {
    it('should do a filter on an array', function() {
      var even = function(x) { return x % 2 === 0 }
      var selectEven = It.select(even)
      expect(selectEven([1,2,3,4])).to.deep.equal([2,4])
      selectEven = It.filter(even)
      expect(selectEven([1,2,3,4])).to.deep.equal([2,4])
    })
  })


})











