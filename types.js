/*  -*-  indent-tabs-mode:nil; coding: utf-8 -*-
  Copyright (C) 2015
      "Mu Lei" known as "NalaGinrut" <NalaGinrut@gmail.com>
  Artanjs is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License by the Free
  Software Foundation, either version 3 of the License, or (at your
  option) any later version.

  Artanjs is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program.
  If not, see <http://www.gnu.org/licenses/>.
*/

var easejs = require('easejs');
var Class = easejs.Class;
var Class_isA = easejs.Class_isA;

var Artanjs_Type =
  Class( 'Artanjs_Type',
         {
           'private _obj' : 'undefined',
           
           'public get_val' : function () { return this._obj; },

           'public set_val' : function (x) { this._obj = x; return x;},
           
           'virtual public equal' : function (x) {
             return this._obj === x.get_val();
           },

           'virtual public print' : function () {
             return this._obj;
           }
         });
exports.Artanjs_Type = Artanjs_Type;

var Artanjs_Unspecified = Class( 'Artanjs_Unspecified' ).extend( Artanjs_Type );
var _unspecified_ = Artanjs_Unspecified('*unspecified*');
exports._unspecified_ = _unspecified_;

var Artanjs_Boolean = Class( 'Artanjs_Boolean' ).extend( Artanjs_Type );
exports.Artanjs_Boolean = Artanjs_Boolean;

var Artanjs_True = Artanjs_Boolean(true);
exports.Artanjs_True = Artanjs_True;

var Artanjs_False = Artanjs_Boolean(false);
exports.Artanjs_False = Artanjs_False;
           
var Artanjs_HashTable =
  Class( 'Artanjs_HashTable ')
  .extend( Artanjs_Type,
           {             
             'public get_size' : function () {
               return this._obj.length;
             },

             'public __construct' : function (h) {
               var ht = [];
               for (k in h) {
                 if (h.hasOwnProperty(k))
                   ht[k] = h[k];
               }
               this._obj = ht;
             },

             'public ref' : function (k) {
               return this._obj[k];
             },

             'public set' : function (k, v) {
               this._obj[k] = v;
             },

             'public has' : function (k) {
               return this.ref(k) !== 'undefined';
             }
           });
exports.Artanjs_HashTable = Artanjs_HashTable;

var Artanjs_String =
  Class( 'Artanjs_String' )
  .extend( Artanjs_Type,
           {
             'private len' : 0,
             
             'private immutable' : true,

             'public __construct' : function (val, immu) {
               this._obj = val;
               this.len = val.length;
               if (immu === true)
                 this.immutable = true;
             },

             'override public equal' : function (s) {
               if (!Class_isA(Artanjs_String, s))
                 throw Error('Wrong type argument (expecting string): ' + s)
               if (this.len !== s.len)
                 return false;
               for (var i = 0, len = this.len; i < len; i++) {
                 if (this._obj[i] !== s.ref(i))
                   return false;
               }
               return true;
             },

             'public foreach' : function (proc, start, end) {
               var s = 0, e = 0;
               if (start !== 'undefined') s = start;
               if (end !== 'undefined') e = this.len;
               if (s > e)
                 throw Error('Value out of range ' + s + 'to ' + e + ': ' + s);
               if (!Class_isA(Artanjs_Lambda, proc))
                 throw Error("It's not a valid procedure: " + proc);
               for (var i = s, len = this.len; i < e; i++) {
                 proc(Artanjs_Char(this._obj[i]));
               }
             },

             'public map' : function (proc, start, end) {
               var s = 0, e = 0;
               var ret = [];
               if (start !== 'undefined') s = start;
               if (end !== 'undefined') e = this.len;
               if (s > e)
                 throw Error('Value out of range ' + s + 'to ' + e + ': ' + s);
               if (!Class_isA(Artanjs_Lambda, proc))
                 throw Error("It's not a valid procedure: " + proc);
               for (var i = s, len = this.len; i < e; i++) {
                 ret.push(proc(Artanjs_Char(this._obj[i])));
               }
               return Artanjs_List(ret);
             },

             'public ref' : function (i) {
               if (i >= this.len)
                 throw Error('Value out of range 0 to 3: ' + i);
               var ch = this._obj[i];
               return Artanjs_Char(ch);
             },
             
             'public set' : function (i, c) {
               if (this.immutable)
                 throw Error('string is read-only: ' + this._obj);
               else if (!Class_isA(Artanjs_Char, c))
                 throw Error("Wrong type argument in position 3 (expecting character): " + c);
               this._obj[i] = c.get_val();
             }
           });
exports.Artanjs_String = Artanjs_String;

var Artanjs_Intern_Table = Artanjs_HashTable({});

// FIXME: if the symbol is already interned, don't produce the symbol instance.
var Artanjs_Symbol =
  Class( 'Artanjs_Symbol' )
  .extend( Artanjs_Type,
           {
             'private intern' : false,

             'public is_intern' : function () {
               return this.intern !== false
             },

             'private intern_sym' : function (str) {
               if (!Class_isA(Artanjs_String, val))
                 throw Error('Wrong type (expecting string): ' + val);
               var n = Artanjs_Intern_Table.size + 1;
               Artanjs_Intern_Table.set(str, n);
               this.intern = n;
             },

             'public dump' : function () {
               return Artanjs_Intern_Table[this.intern];
             },

             'public __construct' : function (val) {
               if (Artanjs_Intern_Table.ref(val) === 'undefined')
                 this.intern_sym(val);
             }
           });
exports.Artanjs_Symbol = Artanjs_Symbol;

// We intern keywords for performance
var Artanjs_Keyword =
  Class( 'Artanjs_Keyword' )
  .extend( Artanjs_Type,
           {
             'public intern' : false,
             
             'public __construct' : function (val) {
               if (!Class_isA(Artanjs_String, val))
                 throw Error('Wrong type (expecting string): ' + val);
               var n = Artanjs_Intern_Table.size + 1;
               var kw = '\u029e' + val;
               Artanjs_Intern_Table.set(kw, n);
               this.intern = n;
             },

             'override equal' : function (kw) {
               if (!Class_isA(Artanjs_Keyword, kw))
                 return false;
               return kw.intern === this.intern;
             },

             'override public print' : function () {
               var kw = Artanjs_Intern_Table.ref(this.intern);
               return '#:' + /^\u029e(.*)/.exec(kw)[1];
             }
           });
exports.Artanjs_Keyword = Artanjs_Keyword;

var Artanjs_Char_table =
  ['nul', 'soh', 'stx', 'etx', 'eot', 'enq', 'ack', 'bel',
   'bs' , 'ht' , 'lf' , 'vt' , 'ff' , 'cr' , 'so' , 'si',
   'dle', 'dc1', 'dc2', 'dc3', 'dc4', 'nak', 'syn', 'etb',
   'can', 'em',  'sub', 'esc', 'fs' , 'gs' , 'rs' , 'us'];
var Artanjs_Char =
  Class( 'Artanjs_Char' )
  .extend( Artanjs_Type,
           {
             'override public equal' : function (c) {
               if (!Class_isA(Artanjs_Char, c))
                 throw Error('Wrong type argument (expecting character): ' + c)
               return this._obj === c.get_val();
             },

             'public to_integer' : function () {
               return this._obj.charCodeAt(0);
             },

             'private num2char' : function (n) {
               if (((n >=0) && (n < 0xd800)) || ((n > 0xdfff) && (n <= 0x10ffff)))
                 return String.fromCharCode(n);
               throw Error("out-of-range hex character escape: " + n); 
             },
             
             'private name2char' : function (name) {
               var ret = Artanjs_Char_table.indexOf(name);
               if (ret === 'undefined')
                 throw Error("unknown character name " + val);
               return ret;
             },
               
             'public __construct' : function (val) {
               var ch;
               switch(true) {
               case /^[a-zA-Z ]+$/.test(val): ch = val; break;
               case /^[0-9]+$/.test(val): ch = this.num2char(val); break;
               case /^sp|space$/.test(val): ch = 32; break;
               case /^newline|nl$/.test(val): ch = 10; break;
               case /^np|page$/.test(val): ch = 12; break;
               case val === 'null': ch = 0; break;
               default: this.name2char(val);
               }
               this._obj = ch;
             },

             'override public print' : function () {
               var ch;
               var num = this._obj;
               if (Artanjs_Char_table[num] !== 'undefined')
                 ch = Artanjs_Char_table[num];
               else if (num === 32)
                 ch = 'space';
               else if (num === 10)
                 ch = 'newline';
               else if (num === 0)
                 ch = 'null';
               else
                 ch = String.fromCharCode(num);
               return '#\\' + ch;
             }
           });
exports.Artanjs_Char = Artanjs_Char;

var Artanjs_Callable =
  Class( 'Artanjs_Callable' )
  .extend( Artanjs_Type,
           {
             'public __construct' : function (val) {
               this._obj = val;
             },

             'public is_macro' : false
           });
exports.Artanjs_Callable = Artanjs_Callable;

var Artanjs_Continuation = Class( 'Artanjs_Continuation' ).extend( Artanjs_Type );
exports.Artanjs_Continuation = Artanjs_Continuation;

var Artanjs_Pair =
  Class( 'Artanjs_Pair' )
  .extend( Artanjs_Type,
           {
             'virtual public __construct' : function (pair) {
               this._obj = pair;
             },
             
             'public car' : function () {
               return this._obj[0];
             },
             
             'public virtual cdr' : function () {
               return this._obj[1];
             },
             
             'public set_car' :  function (v) {
               this._obj[0] = v;
             },

             'virtual public set_cdr' : function (v) {
               this._obj[1] = v;
             },
             
             'virtual override public print' : function () {
               var objs = this._obj.map(function (e, i, arr) { return e.print(); });
               return '(' + objs[0] + ' . ' + objs[1] + ')';
             }
           });
exports.Artanjs_Pair = Artanjs_Pair;

var Artanjs_Pair_List =
  Class( 'Artanjs_Pair_List' )
  .extend( Artanjs_Pair,
           {
             'override public cdr' : function () {
               return Artanjs_Pair_List(this.obj.slice(1));
             },

             'override public print' : function () {
               var o = this._obj.slice(0, this._obj.length);
               var end = this._obj[this._obj.length];
               var objs = o.map(function (e, i, arr) { return e.print(); });
               return '(' + objs.join(' ') + ' . ' + end.print() + ')';
             }
           });
exports.Artanjs_Pair_List = Artanjs_Pair_List;

/* We don't implement for-each and map here, but in Scheme later.
 * Or it's not so hackable.
 */
var Artanjs_List =
  Class( 'Artanjs_List' )
  .extend( Artanjs_Pair,
           {
             'public copy' : function () { return this; },

             'public len' : 0,

             'override public __construct' : function (val) {
               this._obj = val;
               this.len = val.length;
             },
             
             'override public cdr' : function () {
               return Artanjs_List(this._obj.slice(1));
             },

             'public cadr' : function () {
               return this.cdr().car();
             },

             'public caar' : function () {
               return this.car().car();
             },

             'public caddr' : function () {
               return this.cdr().cdr().car();
             },
             
             'public cddr' : function () {
               return this.cdr().cdr();
             },

             'override public set_cdr' : function (v) {
               var car = this._obj[0];
               this._obj = [car, v];
             },

             'public is_null' : function () {
               return this._obj.length === 0;
             },

             'override public equal' : function (l) {
               if (!Class_isA(Artanjs_List, l))
                 throw Error('Wrong type argument (expecting list): ' + l)
               if (this.len !== l.len)
                 return false;
               for (var i = 0, len = this.len; i < len; i++) {
                 if (this._obj[i] !== l.ref(i))
                   return false;
               }
               return true;
             },

             'public ref' : function (i) {
               if (i >= this.len)
                 throw Error('Value out of range 0 to 3: ' + i);
               var e = this._obj[i];
               return e;
             },
             
             'public set' : function (i, c) {
               if (i >= this.len)
                 throw Error('Value out of range 0 to 3: ' + i);
               this._obj[i] = c.get_val();
             },

             'override public print' : function () {
               var objs = this._obj.map(function (e, i, arr) { return e.print(); });
               return '(' + objs.join(' ') + ')';
             }
           });
exports.Artanjs_List = Artanjs_List;

var Artanjs_Array = Class( 'Artanjs_Array' )
  .extend( Artanjs_Type,
           {
             'public __construct' : function (val) {
               this._obj = val;
             },

             'public ref' : function (i) {
               if (i >= this.len)
                 throw Error('Value out of range 0 to 3: ' + i);
               var e = this._obj[i];
               return e;
             },
             
             'public set' : function (i, c) {
               if (i >= this.len)
                 throw Error('Value out of range 0 to 3: ' + i);
               this._obj[i] = c.get_val();
             }
           });
exports.Artanjs_Array = Artanjs_Array;

var Artanjs_Vector =
  Class( 'Artanjs_Vector' )
  .extend( Artanjs_Array,
           {
             'override public equal' : function (v) {
               if (!Class_isA(Artanjs_Vector, v))
                 throw Error('Wrong type argument (expecting vector): ' + v)
               if (this.len !== l.len)
                 return false;
               for (var i = 0, len = this.len; i < len; i++) {
                 if (this._obj[i] !== l.ref(i))
                   return false;
               }
               return true;
             },

             'override public print' : function () {
               var objs = this._obj.map(function (e, i, arr) { return e.print(); });
               return '#(' + objs.join(' ') + ')';
             }
           });
exports.Artanjs_Vector = Artanjs_Vector;

var Artanjs_Bytevector = Class( 'Artanjs_Bytevector' ).extend( Artanjs_Vector );
exports.Artanjs_Bytevector = Artanjs_Bytevector;

var Artanjs_Number =
  Class( 'Artanjs_Number' )
  .extend( Artanjs_Type,
           {
             'public __construct' : function (val) {
               this._obj = val;
             }
           });
exports.Artanjs_Number = Artanjs_Number;

var Artanjs_Real = Class( 'Artanjs_Real' ).extend( Artanjs_Number );
exports.Artanjs_Real = Artanjs_Real;

var Artanjs_Imagin = Class( 'Artanjs_Imagin' ).extend( Artanjs_Number );
exports.Artanjs_Imagin = Artanjs_Imagin;

var Artanjs_Integer = Class( 'Artanjs_Integer' ).extend( Artanjs_Real );
exports.Artanjs_Integer = Artanjs_Integer;
