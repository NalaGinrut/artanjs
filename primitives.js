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
var Artanjs_Primitives = {
  'foreach' : function (f) {
    var lsts = arguments.slice(1);
    var args = lsts.map(function (e, i, arr) { return e.get_val(); });
    for (i = 0; i < args.length; i++) {
      f.apply(f, args);
    }
  },

  'map' : function (f) {
    var lsts = arguments.slice(1);
    var args = lsts.map(function (e, i, arr) { return e.get_val(); });
    var ret = [];
    for (i = 0; i < args.length; i++) {
      ret.push(f.apply(f, args));
    }
    return ret;
  },
  
  'cons' : function (car, cdr) {
    return Artanjs_Pair([car, cdr]);
  },

  'list' : function () {
    return Artanjs_List(arguments);
  },

  '+' : function () {
    if (arguments.length === 0) {
      return 0;
    } else if (arguments.length === 1) {
      return arguments[0];
    }
    for (var i = 0, ret = 0; i < arguments.length; i++) {
      ret += arguments[i];
    }
    return ret;
  },

  '-' : function () {
    if (arguments.length === 0) {
      throw Error('Wrong number of arguments to -');
    } else if (arguments.length === 1) {
      return -arguments[0];
    }
    var ret = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      ret -= arguments[i];
    }
    return ret;
  },

  '*' : function () {
    if (arguments.length === 0) {
      return 1;
    } else if (arguments.length === 1) {
      return arguments[0];
    }
    for (var i = 0, ret = 1; i < arguments.length; i++) {
      ret *= arguments[i];
    }
    return ret;
  },
  
  '/' : function () {
    if (arguments.length === 0) {
      throw Error('Wrong number of arguments to /');
    } else if (arguments.length === 1) {
      return arguments[0];
    }
    var ret = arguments[0];
    for (var i = 1; i < arguments.length; i++) {
      ret /= arguments[i];
    }
    return ret;
  }
};
exports.Artanjs_Primitives = Artanjs_Primitives;
