(function (window, document, $) {

  /**
   * Converts a whitespace-delimited string to an array
   * @param String str
   */
  var rwhite = /\s+/;

  $.unwhite = function (str) {
    str = $.trim(str);
    return str.length ? str.split(rwhite) : [];
  };

  /**
   * proxy function for event callbacks - omits event argument for better
   * compatibility with external APIs
   */
  $.eventProxy = function (fn, proxy, context) {
    fn = $.proxy.apply(this, arguments);
    return function () {
      return fn.apply(this, Array.prototype.slice.call(arguments, 1));
    };
  };

  /**
   * Set and get deeply nested properties from an object
   */
  var rebrackets = /\[(["']?)([^\1]+?)\1?\]/g,
      reemptydot = /^\./;
  
  $.deep = function (obj, prop, val) {

    // @todo not a regexp guru -- can this be reduced to one expression?
    var props = prop.replace(rebrackets, '.$2').replace(reemptydot, '').split('.'),
        root, i = 0, n, p, ret;

    // Set deep value
    if (arguments.length > 2) {

      root = obj;
      n = props.length - 1;

      while (i < n) {
        p = props[i++];
        obj = obj[p] = (obj[p] instanceof Object) ? obj[p] : {};
      }

      obj[props[i]] = val;

      ret = root;

    // Get deep value
    } else {
      n = props.length;
      while (typeof (obj = obj[props[i]]) !== 'undefined' && ++i < n) {}
      ret =  obj;
    }
    return ret;
  };

  /**
   * Create a namespace on a supplied object
   */
  $.namespace = function (obj, ns) {

    var props = (ns || obj).split('.'),
        i = 0, n = props.length, p;

    obj = (ns && obj) || window;

    while (i < n) {
      p = props[i++];
      obj = obj[p] = (obj[p] instanceof Object) ? obj[p] : {};
    }

    return obj;
  };

  /**
   * Ensure that we have an array to iterate
   */
  $.ensureArray = function (arr) {
    return $.isArray(arr) ? arr : typeof arr !== 'undefined' ? [arr] : [];
  };

  /**
   * Ensure that we have a date to the prom
   */
  $.ensureDate = function (date) {
    return date ? date instanceof Date ? date : new Date(date) : new Date();
  };

  /**
   * Ensure that we have a good time
   */
  $.ensureTime = function (time) {
    if (typeof time === 'string') {
      time = new Date(time);
    }
    if (time instanceof Date) {
      time = time.getTime();
    }
    if (typeof time !== 'number' || isNaN(time)) {
      throw 'jQuery.ensureTime: Invalid date: ' + time;
    }
    return time;
  };

  // @todo incorporate ensureDate
  $.floorDate = function (floor /*, date, clone */) {

    var clone = (arguments[2] === true),
        date  = (typeof arguments[1] !== 'undefined') ? arguments[1] : new Date();

    if (clone || !(date instanceof Date)) {
      date = new Date(date);
    }

    switch (floor) {
      case 'year':   date.setMonth(0);
      case 'month':  date.setDate(1);
      case 'day':    date.setHours(0);
      case 'hour':   date.setMinutes(0);
      case 'minute': date.setSeconds(0);
      default:       date.setMilliseconds(0);
    }

    return date;
  };

  /**
   * Re-index an object, optionally maintaining the original index and/or
   * modifying the original object (instead of a clone)
   */
  $.rehash = function (source, property, maintainSourceKey, modifySource) {

    var target = modifySource ? source : {}, sourceKey, sourceVal, targetKey;

    for (sourceKey in source) {
      if (source.hasOwnProperty(sourceKey)) {

        sourceVal = source[sourceKey];

        // Convert to string to allow rehashing by booleans!
        targetKey = '' + $.deep(sourceVal, property);

        if (targetKey) {

          if (targetKey in target) {
            (target[targetKey] = $.ensureArray(target[targetKey])).push(sourceVal);
          } else {
            target[targetKey] = sourceVal;
          }

          if (modifySource && !maintainSourceKey) {
            delete target[sourceKey];
          } else if (maintainSourceKey && !modifySource) {
            target[sourceKey] = sourceVal;
          }
        }

      }
    }

    return target;
  };

  /**
   * Dots!
   */
  $.truncate = function (str, n) {
    return str.length < n ? str : (new RegExp('^(.{0,' + (n - 1) + '}\\S)(\\s|jQuery)')).exec(str)[1] + '...';
  };

  /**
   * First in flight
   */
  $.ordinal = function (n) {
    return ['th', 'st', 'nd', 'rd'][(n = n < 0 ? -n : n) > 10 && n < 14 || !(n = ~~n % 10) || n > 3 ? 0 : n];
  };

  /**
   * Lifted from YUI 2.6.0
   * IE will not enumerate native functions in a derived object even if the
   * function was overridden.  This is a workaround for specific functions
   * we care about on the Object prototype.
   */
  $.support.nativeEnum = (function () {

    var target = { valueOf: function () { return false; } },
        source = { valueOf: function () { return true; } },
        name;

    for (name in source) {
      if (source.hasOwnProperty(name)) {
        target[name] = source[name];
      }
    }

    return target.valueOf();
  })();

  $.IENativeEnumFix = function (target, source) {
    $.each(['toString', 'valueOf'], function (i, name) {
      var fn = source[name];
      if ($.isFunction(fn) && fn !== Object.prototype[name]) {
        target[name] = fn;
      }
    });
  };


  /**
   * Pseudo-classical OOP inheritance
   * @param Function child
   * @param Function parent
   * @param Object overrides
   */
  $.inherit = function (child, parent, overrides) {

    if (!$.isFunction(parent) || !$.isFunction(child)) {
      throw new Error('jQuery.inherit failed, please check that all dependencies are included.');
    }

    var name;

    function F () {
      this.__super__ = parent.prototype;
    }

    F.prototype = parent.prototype;

    child.prototype = new F();
    child.prototype.constructor = child;
    child.__super__ = parent.prototype;
    child.superclass = parent.prototype; // provided for back-compat @mlb

    if (parent.prototype.constructor === Object.prototype.constructor) {
      parent.prototype.constructor = parent;
    }

    if (overrides) {
      for (name in overrides) {
        if (overrides.hasOwnProperty(name)) {
          child.prototype[name] = overrides[name];
        }
      }

      if (!$.support.nativeEnum) {
        $.IENativeEnumFix(child.prototype, overrides);
      }
    }
  };


})(this, this.document, this.jQuery);