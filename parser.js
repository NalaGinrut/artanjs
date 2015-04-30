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

var types = require('./types');
var Artanjs_Type = types.Artanjs_Type;
var _unspecified_ = types._unspecified_;
var Artanjs_Boolean = types.Artanjs_Boolean;
var Artanjs_True = types.Artanjs_True;
var Artanjs_False = types.Artanjs_False;
var Artanjs_HashTable = types.Artanjs_HashTable;
var Artanjs_String = types.Artanjs_String;
var Artanjs_Symbol = types.Artanjs_Symbol;
var Artanjs_Keyword = types.Artanjs_Keyword;
var Artanjs_Char = types.Artanjs_Char;
var Artanjs_Callable = types.Artanjs_Callable;
var Artanjs_Continuation = types.Artanjs_Continuation;
var Artanjs_Pair = types.Artanjs_Pair;
var Artanjs_Pair_List = types.Artanjs_Pair_List;
var Artanjs_List = types.Artanjs_List;
var Artanjs_Array = types.Artanjs_Array;
var Artanjs_Vector = types.Artanjs_Vector;
var Artanjs_Bytevector = types.Artanjs_Bytevector;
var Artanjs_Number = types.Artanjs_Number;
var Artanjs_Real = types.Artanjs_Real;
var Artanjs_Imagin = types.Artanjs_Imagin;
var Artanjs_Integer = types.Artanjs_Integer;

var Artanjs_Primitives = require('./primitives').Artanjs_Primitives;

var readline = require('./readline');

var Artanjs_Env =
  Class( 'Artanjs_Env',
         {
           'private outer' : 'undefined',
           
           'private get_outer' : function () {
             return this.outer;
           },

           'private _env' : 'undefined',

           'public _get_env' : function () {
             return this._env;
           },

           'public __construct' : function (outer, val) {
             this._env = Artanjs_HashTable(val);
             this.outer = outer;
           },

           'public find' : function (sym) {
             var e = this;
             var k = sym.dump();
             while(e !== 'undefined') {
               var ht = e._get_env();
               if (e.has(k)) return e.ref(k);
               e = e.get_outer();
             }
             return '__!@#$%^&_no_val_!@#@#$';
           },

           'public set' : function (sym, val) {
             var k = sym.dump();
             this._env.set(k, val);
           },

           'public has' : function (sym) {
             var k = sym.dump();
             return this.find(k) !== '__!@#$%^&_no_val_!@#@#$';
           }
         });
exports.Artanjs_Env = Artanjs_Env;

var Artanjs = 
  Class( 'Artanjs',
         {
           // Don't use it directly, just for debug
           'public token_list' : 'undefined',
           
           'private delimiters' : /( |\"|\r|\n|#:|;.*|#?\(|#?{|#?\[|\)|\]|}|#?`|#?'|#?,@|#?,|#?;)/,

           'private tokenize' : function (str) {
             var ignore = /^$|^;.*| $/;
             var tokens = str.split(this.delimiters);
             this.token_list = tokens; // Don't use it directly, just for debug
             return tokens.filter(function (t) { return !ignore.test(t); });
           },

           'private make_reader' : function (str) {
             var tokens = this.tokenize(str).reverse();
             return {
               '_obj' : tokens,
               'cmt_cnt' : 0, // count of block comments need to skip
               'top' : function () { return this._obj.unshift(); },
               'get' : function () { return this._obj.pop(); }
             };
           },

           'private skip_block_comment' : function (r) {
             if (r.cmt_cnt === 0)
               return;
             else
               while (r.cmt_cnt-- > 0) r.get();
           },

           // doesn't include 'end'
           'private read_seq' : function (r, end) {
             var seq = [];
             var is_pair = false;
             while (!end.test(r.top())) {
               if (r.top() === '.') {
                 is_pair = true;
                 r.get();
               }
               seq.push(this.read_form(r));
             }
             if (r.get() !== end) throw Error("BUG: read_seq didn't finish correctly!");
             if (is_pair) return Artanjs_Pair_List(seq);
             return seq;
           },

           'private read_list' : function (r) {
             r.get(); // skip '([{'
             var seq = this.read_seq(r, /(\(|\[|\{)/);
             if (Class_isA(Artanjs_Pair, seq))
               return seq;
             return Artanjs_List(seq);
           },

           'private read_vector' : function (r) {
             r.get(); // skip '#('
             var seq = this.read_seq(r, /#(/);
             return Artanjs_Vector(seq);
           },
           
           'private read_char' : function (r) {
             var token = r.get();
             var ch = /#\\(.*)/.exec(token)[0][2];
             if (ch === 'undefined')
               throw Error("BUG: Invalid char '" + token + "'");
             return Artanjs_Char(ch);
           },

           'private read_string' : function (r) {
             r.get(); // skip \"
             var str = r.get();
             if (r.get() !== '"')
               throw Error("expected '\"'");
             return Artanjs_String(str);
           },
             
           'private read_keyword' : function (r) {
             r.get(); // skip '#:'
             return Artanjs_Symbol(r.get());
           },

           'private make_sexpr' : function (r, prefix) {
             r.get();
             var p = Artanjs_Symbol(prefix);
             return Artanjs_List([p, read_form(r)]);
           },

           // We don't support array yet
           'private read_form' : function (r) {
             if (r.top() === '#;')
               throw Error("BUG: read_expr shouldn't encounter '#;'");
             var token = r.top();
             var ret;
             switch (true) {
             case /#\\.*/.test(token): ret = this.read_char(r); break;
             case token === '"': ret = this.read_string(r); break;
             case /(\(|\[|\{)/.test(token): ret = this.read_list(r); break;
             case token === '#:': ret = this.read_keyword(r); break;
             case token === '#(': ret = this.read_vector(r); break;
             case token === "'": ret = this.make_sexpr(r, 'quote'); break;
             case token === '`': ret = this.make_sexpr(r, 'quasiquote'); break;
             case token === ',': ret = this.make_sexpr(r, 'unquote'); break;
             case token === ',@': ret = this.make_sexpr(r, 'unquote-splicing'); break;
             default: ret = Artanjs_Symbol(token);
             }
             return ret;
           },

           'public parser' : function (str) {
             var reader = this.make_reader(str);
             var token;
             var comment_begin = false;
             var ret = [];
             while ((token = reader.top()) !== 'undefined') {
               if (comment_begin) {
                 if (token !== '#;') continue;
                 // skip block comments
                 else { reade_form(reader); comment_begin = false; }
               }
               token = reader.get();
               switch (true) {
               case token === '#;': reader.cmt_cnt++; comment_begin = true; break;
               case /^\n\r|\n|\r$/.test(token): ret.push(this.skip_comment(reader)); break;
               default: ret.push(this.read_form(reader));
               }
             };
             return ret;
           },

           'private quasiquote' : function (ast) {
             if (!Class_isA(Artanjs_Pair, ast)) {
               return Artanjs_List([Artanjs_Symbol('quote'), ast]);
             } else if (ast.car() === 'unquote') {
               return ast.cadr();
             } else if (Class_isA(Artanjs_Pair, ast.car()) &&
                        ast.caar() === 'splice-unquote') {
               return Artanjs_List(Artanjs_Symbol('concat'),
                                   ast.cdar(),
                                   this.quasiquote(ast.cdr()));
             } else {
               return Artanjs_List(Artanjs_Symbol('cons'),
                                   this.quasiquote(ast.car()),
                                   this.quasiquote(ast.cdr()));
             }
           },

           'private is_macro_call' : function (ast, env) {
             return Class_isA(Artanjs_List, ast) &&
               Class_isA(Artanjs_Symbol, ast.car()) &&
               env.has(ast.car()) &&
               Class_isA(Artanjs_Macro, env.get(ast.car()));
           },

           'public macroexpand' : function (ast, env) {
             while (is_macro_call(ast, env)) {
               var mac = env.find(ast.car());
               ast = mac.apply(mac, ast.cdr());
             }
             return ast;
           },

           'private eva_seq' : function (ast, env) {
             while (true) {
               if (ast.is_null()) {
                 return _unspecified_;
               } else if (ast.cdr().is_null()) {
                 return this.eval(ast.car(), env);
               } else {
                 this.eval(ast.car(), env);
                 ast = ast.cdr();
                 continue;
               }
             }
           },

           'public eval' : function (ast, env) {
             // Although I hate while-loop, we need it for TCO.
             while (true) {
               if (!Class_isA(Artanjs_List, ast)) {
                 return this.eval_ast(ast, env);
               }

               // apply list
               ast = this.macroexpand(ast, env);
               if (!Class_isA(Artanjs_List, ast))
                 return ast;
               
               switch (ast.car().get_val()) {
               case 'define':
                 var res, k, expr;
                 if (ast.length = 3) {
                   k = ast.cadr();
                   res = ast.cddr();
                 } else if (ast.length = 2) {
                   k = ast.cadr();
                   res = _unspecified_;
                 } else {
                   throw Error('source expression failed to match any pattern in form ' + ast.print());
                 }
                 
                 if (Class_isA(Artanjs_Symbol, k)) {
                   expr = this.eval(ast.cddr(), env);
                 } else if (Class_isA(Artanjs_List, k)) {
                   var params = k.cdr();
                   var k = k.car();
                   var lambda = Artanjs_List([Artanjs_Symbol('lambda'), params, res]);
                   expr = this.eval(lambda, env);
                 } else {
                   throw Error('source expression failed to match any pattern in form ' + ast.print());
                 }
                 return env.set(k, expr);
               case 'let':
                 // In our implementation, let is same with let*, it's not denied by
                 // RnRS, just doesn't guarante the order.
                 var let_env = Artanjs_Env(env, {});
                 var bindings = ast.caddr().get_val();
                 var body = ast.cddr();
                 for (var i = 0; i < bindings.length; i++) {
                   this.eval.set(bindings.car(), this.eval(bindings.cadr(), env));
                 }
                 ast = body;
                 env = let_env;
                 continue;
               case 'let*':
                 var let_env = Artanjs_Env(env, {});
                 var bindings = ast.caddr().get_val();
                 var body = ast.cddr();
                 for (var i = 0; i < bindings.length; i++) {
                   this.eval.set(bindings.car(), this.eval(bindings.cadr(), env));
                 }
                 ast = body;
                 env = let_env;
                 continue;
               case 'macroexpand': return this.macroexpand(ast, env);
               case 'quote': return ast.ref(1);
               case 'quasiquote': return this.eval(ast, env);
               case 'defmacro':
                 if (ast.length > 2) {
                   throw Error('Invalid argument list in subform ' + ast.print());
                 }
                 var c = this.eval(ast.caddr(), env);
                 c.is_macro = true;
                 env.set(ast.car(), c);
               case 'if':
                 var cnd, thn, els = false;
                 if (ast.length = 3) {
                   cnd = ast.ref(1);
                   thn = ast.ref(2);
                 } else if (ast.length = 4) {
                   cnd = ast.ref(1);
                   thn = ast.ref(2);
                   els = ast.ref(3);
                 } else {
                   throw Error('source expression failed to match any pattern in form ' + ast.print());
                 }
                 if (this.eval(cnd, env).equal(Artanjs_False)) {
                   ast = thn;
                   continue;
                 } else if (!els) {
                   return _unspecified_;
                 } else {
                   ast = els;
                   continue;
                 }
               case 'lambda':
                 var params = ast.cadr();
                 var is_vararg = Class_isA(Artanjs_Pair_List, params);
                 var body = ast.cddr();
                 var func = function () {
                   var new_env = Artanjs_Env(env, {});
                   for (var i = 0; i < arguments.length; i++) {
                     if (is_vararg && i == arguments.length-1) {
                       new_env.set(params.ref(i), Artanjs_List(arguments.slice(i)));
                       break;
                     }
                     new_env.set(params.ref(i), arguments[i]);
                   }
                   // TODO: hmm...no TCO yet
                   while (true) {
                     if (body.is_null()) {
                       return _unspecified_;
                     } else if (body.cdr().is_null()) {
                       return this.eval(body.car(), env);
                     } else {
                       this.eval(body.car(), env);
                       body = body.cdr();
                       continue;
                     }
                   }
                 };
                 return Artanjs_Callable(func);
               default: return this.eval_func(ast, env);
               }
             }
           },

           'public printer' : function (x) {
             return x.print();
           },

           'private TOPLEVEL' : Artanjs_Env(Artanjs_Primitives),

           'private READ' : function () {
             return this.parser(this.readline('user >'));
           },

           'public REPL' : function () {
             while (true) {
               this.printer(this.eval(this.READ()), this.TOPLEVEL);
             }
           }
         });
exports.Artanjs = Artanjs;
