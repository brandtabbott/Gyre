/*!
 * Gyre.js 1.0.0
 * @author: Brandt A. Abbott
 *
 * Includes Simple JavaScript Inheritance
 * http://ejohn.org/
 *
 * Released under the MIT license
 *
 * Date: 2014-01-23T21:02Z
 */
(function(global) {
  "use strict";
  var fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  function BaseClass(){}

  // Create a new Class that inherits from this class
  BaseClass.extend = function(props) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    var proto = Object.create(_super);

    // Copy the properties over onto the new prototype
    for (var name in props) {
      // Check if we're overwriting an existing function
      proto[name] = typeof props[name] === "function" && 
        typeof _super[name] == "function" && fnTest.test(props[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);        
            this._super = tmp;

            return ret;
          };
        })(name, props[name]) :
        props[name];
    }

    // The new constructor
    var newClass = typeof proto.init === "function" ?
      proto.init : // All construction is actually done in the init method
      function(){};

    // Populate our constructed prototype object
    newClass.prototype = proto;

    // Enforce the constructor to be what we expect
    proto.constructor = newClass;

    // And make this class extendable
    newClass.extend = BaseClass.extend;

    return newClass;
  };

  // export
  global.Class = BaseClass;
})(this);

if ('undefined' === typeof Gyre) {
  /**
  * Gyre
  * @namespace
  * @version 1.0.0
  */
  Gyre = {};
  Gyre.version = '1.0.0';
  console.clear();
  console.info('Gyre version:',Gyre.version);
}

Gyre.Logging = function(level){
  if(typeof(level) == 'undefined' || level == null)
    return;

  if(level=='DEBUG'){
    //Modify console logging
    if(window.console && console.debug){
      var old = console.debug;
      console.debug = function(){
        Array.prototype.unshift.call(arguments, 'DEBUG');
        old.apply(this, arguments);
      }
    }
    //Hack for IE 9 to work correctly
    else if(window.console && !console.debug && console.log){    
      var old = console.log;    
      console.debug = function(){
        Function.prototype.bind.call(old, console).apply(this, arguments);
      }
    } 
  }
  else{
    console.debug = function(){};    
  }
};

/**
* Gyre.MVC
* @namespace
*/
Gyre.MVC = {};

/**
* jQuery
*/
Gyre.$ = jQuery;

/**
* Global Environment
*/
Gyre.ENV = {};

/**
* A class to hold a socket.io instance.  Each instance forces a new websocket connection.
* @class
* @memberOf Gyre
* @example var webSocket = new Gyre.WebSocket();
* webSocket.socket.emit('foo');
*/
Gyre.WebSocket = Class.extend({
  init: function() {
    this.name="Gyre.WebSocket";
    /** 
    * @member {object} socket
    * @memberOf Gyre.WebSocket#
    */    
    this.socket=io.connect('http://'+location.host, {'force new connection': true});
    console.debug(this.name+'.init - WebSocket initialized and ready for use');
  }
});

/**
* AJAX Loading class.
* @class
* @memberOf Gyre
*/
Gyre.AjaxLoader = Class.extend({
  init: function() {
    this.name="Gyre.AjaxLoader";
  }, 

  /**
  * @method
  * @memberOf Gyre.AjaxLoader#
  * @param {string} url - url
  * @param {string} data - data to pass to the request
  */
  loadJSON: function(url, data){
    self = this;

    return Gyre.$.ajax({
      dataType: "json",
      url: url,
      data: data,
      cache: false
    });
  },

  /**
  * @method
  * @memberOf Gyre.AjaxLoader#  
  * @param {string} url - url
  * @param {string} data - data to pass to the request
  */
  load: function(url, data){
    return Gyre.$.ajax({
      url: url,
      async: false,
      type: "GET",
      cache: false
    });
  },

  /**
  * @method
  * @memberOf Gyre.AjaxLoader#
  * @param {string} url - url
  * @param {string} data - data to pass to the request
  */
  recoverFrom401: function(url, data){
    console.debug(this.name+'.recoverFrom401 - ','Recovering from 401, sending request again to url:',url);
    return Gyre.$.ajax({
      headers:Gyre.ENV.AUTHORIZATION_HEADERS,
      dataType: "json",
      url: url,
      data: data,
      cache: false
    });
  }
});

/**
* AJAX Post class.
* @class
* @memberOf Gyre
*/
Gyre.AjaxPoster = Class.extend({
  init: function() {
    this.name="Gyre.AjaxPoster";
  },

  /**
  * @method
  * @memberOf Gyre.AjaxPoster#
  * @param {string} url - url
  * @param {string} data - json serialized form data
  * @param {function} beforeSend - beforeSend callback
  * @param {function} beforeSend - success callback
  * @param {function} error - error callback
  */
  post: function(url, data, beforeSend, success, error){
    return Gyre.$.ajax({
      type: "POST",
      dataType: "json",
      url: url,
      data: data,
      cache: false,
      beforeSend: beforeSend,
      success: success,
      error: error
    });
  } 
});

/**
* {@link http://handlebarsjs.com Handlebars} utility class
* @class
* @memberOf Gyre
*/
Gyre.Handlebars = Class.extend({
  init: function() {
    this.name="Gyre.Handlebars";
  },

  /**
  * Loads a {@link http://handlebarsjs.com handlebars} template from a URL (via AJAX) and then renders it
  * @method
  * @memberOf Gyre.Handlebars#
  * @param {string} url - url of the .hbs template
  * @param {string} templateId - the Id of the handlebars template script tag
  * @param {string} context - the data to load into the template
  */
  loadAndRenderHandlebarsTemplate: function(url, templateId, context) {
    var self = this;

    var loader = new Gyre.AjaxLoader();
    loader.load(url).done(function(template){
      Gyre.$('#'+templateId).html(template);
      self.renderHandlebarsTemplate(templateId,context);
    });
  },

  /**
  * Renders a {@link http://handlebarsjs.com handlebars} template
  * @method  
  * @memberOf Gyre.Handlebars#
  * @param {string} templateId - the Id of the handlebars template script tag
  * @param {string} context - the data to load into the template
  */
  renderHandlebarsTemplate: function(templateId, context){
    console.debug(this.name+'.renderHandlebarsTemplate - template:',templateId,'context:',context);
    var template = Handlebars.compile(Gyre.$('#'+templateId).html());          
    if(Gyre.$('.'+templateId).length==0)
      Gyre.$(template(context)).insertBefore(Gyre.$('#'+templateId));  
    else
      Gyre.$('.'+templateId).replaceWith(template(context));
  }  
});

/**
* @class
* @memberOf Gyre.MVC
* @example //Extend as follows:
MyApp.MyModel = Gyre.MVC.Model.extend({  
  init: function() {
    this._super();
    this.name='MyApp.MyModel';
  }
});
*/
Gyre.MVC.Model = Class.extend({
  init: function() {
    this.name="Gyre.MVC.Model";
    this.content = null;
    this.contentToSave = null;
    this.isLoaded = false;
    this.promise = Gyre.$.Deferred();
    this.lastURL = null;
    this.lastData = null;
    this.gyreWebSocket = null;
    this.loadURL = null;
    this.saveURL = null;
  },

  /**
  * Used to munge/serialize json content
  * @method  
  * @memberOf Gyre.MVC.Model#
  * @param {string} content - json content loaded into the model
  */  
  serialize: function(content) {

  },

  /**
  * Utilizes jQuery to load a model via AJAX
  * @method  
  * @memberOf Gyre.MVC.Model#
  * @param {string} url - url of the JSON model
  * @param {string} data - data to pass to the request
  */
  loadModel: function(url, data) {
    //Store the last url, and last data for reLoadModel
    this.lastURL = url;
    this.lastData = data;

    console.debug(this.name+'.loadModel -','loading model from url:',url);
    var self = this;

    var loader = new Gyre.AjaxLoader();
    self.promise = loader.loadJSON(url, data)
      .then(function(data, textStatus, jqXHR) {
        self.content = data;
        self.isLoaded = true;
      }, function(jqXHR, textStatus, errorThrown) {
        if(jqXHR.status===401){          
          return loader.recoverFrom401(url, data)
            .done(function(data, textStatus, jqXHR){
              self.content = data;
              self.isLoaded = true;
          });
        }         
      });  
  },

  /**
  * Utilizes socket.io to load a model
  * @method
  * @memberOf Gyre.MVC.Model#
  * @param {string} emitEvent - Event to emit.  Server should listen for this event and emit "data" and/or "error".
  * @param {object} emitObject - Object data to emit to the server
  */
  loadModelFromWebSocket: function(emitEvent, emitObject){
    var self = this;

    this.gyreWebSocket = new Gyre.WebSocket();
    this.gyreWebSocket.socket.emit(emitEvent,emitObject);

    console.debug(this.name+'.loadModelFromWebSocket -','loading model from websocket with:',emitEvent,emitObject);

    this.gyreWebSocket.socket.on('data', function(data){
      console.debug(self.name+'.loadModelFromWebSocket -','received data from WebSocket:',data);
      self.content = data.json;
      self.isLoaded = true;
      self.promise.notify(data.json);
    });

    this.gyreWebSocket.socket.on('error', function(e){
      console.debug(self.name+'.loadModelFromWebSocket -','could not load model from websocket because of:',e);
      Gyre.Messaging.PageMessage.pushAutoFadeOutMessage('There is a problem communicating with the server.  Attempting to reconnect...', '.content', 'alert-warning"');
    });
  },

  /**
  * Reload a model loaded via AJAX (loadModel).  Models loaded via WebSocket should utilize the socket to reload the model.
  * @method
  * @memberOf Gyre.MVC.Model#
  */
  reLoadModel: function() {
    var self = this;

    if(this.isLoaded)
      this.loadModel(this.lastURL, this.lastData);
    else
      this.promise.then(function() {this.loadModel(self.lastURL, self.lastData)});
  },

  save: function() {
    console.debug(this.name+" - saving model with data: ",this.contentToSave);
    Gyre.Messaging.PageMessage.clearAll();
    Gyre.Messaging.FieldMessage.clearAll();
    return this.saveModel(this.saveURL, Gyre.$(this.contentToSave.form).serialize(), this.contentToSave.formId);
  }, 

  /**
  * Save a model via AJAX.  Must provide a serialized form
  * @method
  * @memberOf Gyre.MVC.Model#
  * @param {string} url - URL to POST to
  * @param {string} data - serialized data to POST
  * @param {function} beforeSend - optional callback
  * @param {function} success - optional callback
  * @param {function} error - optional callback
  */
  saveModel: function(url, postData, formId, beforeSend, success, error) {
    var self = this;

    var poster = new Gyre.AjaxPoster();

    beforeSend = typeof(beforeSend)!='undefined' ? beforeSend : function(request){
      Gyre.Messaging.PageMessage.clearAll();
      Gyre.Messaging.FieldMessage.clearAll();      
    };

    success = typeof(success)!='undefined' ? success : function(data, textStatus, XMLHttpRequest){
      //If there is no data returned, then display an error
      if(typeof(data) == 'undefined' || data == null){
        //Return to login hack
        if(XMLHttpRequest.status == 200)
          Gyre.Messaging.ReLoginModal.show();                        
      }
      //If there are errors, then display them
      //Assume: Errors are in data.fieldErrorList
      else if(!data.success && data.fieldErrorList){
        Gyre.Messaging.PageMessage.pushMessage('Changes not saved.  Please see error messages below.', '.content', 'alert-danger');

        //Display field error messages from the response, i.e. {fieldErrorList: {field: "foo", defaultMessage: "errorMessage"}})
        var fieldsWithErrors = [];
        $.each(data.fieldErrorList.reverse(), function(){    
          if($.inArray(this.field, fieldsWithErrors) == -1){      
            fieldsWithErrors.push(this.field);
            Gyre.Messaging.FieldMessage.pushMessage(this.defaultMessage, Gyre.Utilities.esc('#'+formId+' [name="'+this.field+'"]'), 'error');
          }
        });
      }
      else if(!data.success && !data.fieldErrorList){
        Gyre.Messaging.PageMessage.pushMessage('Changes not saved.  Please refresh the page and try again.', '.content', 'alert-danger');
      }
      else if(data.success){
        Gyre.Messaging.PageMessage.clearAll();
        Gyre.Messaging.PageMessage.pushAutoFadeOutMessage('Information saved.', '.content', 'alert-success');
      }
    };    

    error = typeof(error)!='undefined' ? success : function(request, status, error){
      //Return to login hack
      if(request.status == 200)
        Gyre.Messaging.ReLoginModal.show();      
      else
        Gyre.Messaging.PageMessage.pushMessage('Changes not saved.  Please refresh the page and try again.', '.content', 'alert-danger');              
    };

    return poster.post(url,postData,beforeSend,success,error);
  },

  /**
  * Utilizes jQuery to delete a model via AJAX
  * @method  
  * @memberOf Gyre.MVC.Model#
  * @param {string} url - url of the JSON model
  * @param {string} data - data to pass to the request  
  */
  remove: function(url, data) {
    console.debug(this.name+'.delete -','delete calling url:',url);
    var self = this;

    var loader = new Gyre.AjaxLoader();
    self.promise = loader.loadJSON(url, data).then(function(data, textStatus, jqXHR){
      self.content = data;
      self.isLoaded = true;
    }, function(jqXHR, textStatus, errorThrown) {
      if(jqXHR.status===401){          
        return loader.recoverFrom401(url, data).done(function(data, textStatus, jqXHR){
          self.content = data;
          self.isLoaded = true;
        });
      }         
    });  
  }  
});

/**
* @class
* @memberOf Gyre.MVC
* @example //Extend as follows:
MyApp.MyController = Gyre.MVC.Controller.extend({
  init: function() {
    this._super();
    this.name="MyApp.MyController"
    this.template='invoice';
  }
});
*/
Gyre.MVC.Controller = Class.extend({
  init: function() {
    /** 
    * @member {String} template
    * @memberOf Gyre.MVC.Controller#
    */
    this.template = null;
    this.name="Gyre.MVC.Controller"
  },

  /**
  * Render a Handlebars template using the template set on the controller and the model
  * @method
  * @memberOf Gyre.MVC.Controller#
  * @param {string} model - the model to render
  */  
  renderTemplate: function(model){
    var handlebars = new Gyre.Handlebars();
    handlebars.renderHandlebarsTemplate(this.template, model);
  },  

  /**
  * Load a Handlebars template, then render it using template set on the controller and the model
  * @method  
  * @memberOf Gyre.MVC.Controller#
  * @param {string} model - the model to render
  */  
  renderLoadedTemplate: function(model){
    var handlebars = new Gyre.Handlebars();
    handlebars.loadAndRenderHandlebarsTemplate(Gyre.ENV.HANDLEBARS_TEMPLATE_URL+this.template+'.hbs', this.template, model);
  }
});

/**
* Gyre.Messaging
* @namespace
*/
Gyre.Messaging = {};

/**
* @static
* @example
//Create a page message 'Foo' prepended to #mydiv with bg-success color
Gyre.Messaging.PageMessage.pushMessage('Foo', '#myDiv', 'bg-success');
*/
Gyre.Messaging.PageMessage = {
  pushMessage: function(message, selector, level){
    this.clearMessage(selector);

    //This is kinda crapy, oh well
    var constructedMessage = '<div id="gyreMessage" style="margin: 5px 100px 10px 100px; display: none" class="alert '+level+' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+message+'</div>';
    Gyre.$(constructedMessage).prependTo(selector).fadeIn(400);
  },

  pushAutoFadeOutMessage: function(message, selector, level){    
    var id = new Date().getTime();
    var constructedMessage = '<div id="gyreFadingMessage'+id+'" style="margin: 5px 100px 10px 100px; display: none" class="alert '+level+' alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">&times;</button>'+message+'</div>';
    Gyre.$(constructedMessage).prependTo(selector).fadeIn(400);
    Gyre.$('#gyreFadingMessage'+id).delay(5000).fadeOut(400).queue(function(){$(this).remove();});
  },  

  clearMessage: function(selector){
    if(Gyre.$(selector+' :first').attr('id')==='gyreMessage')
      Gyre.$(selector+' :first').remove();
  },

  clearAll: function() {
    Gyre.$('#gyreMessage').remove();  
    Gyre.$('[id*=gyreFadingMessage]').remove();  
  }
};

/**
* @static
* @example
//Create a field message 'Foo'
Gyre.Messaging.FieldMessage.pushMessage('Foo', '#myDiv', 'bg-success');
*/
Gyre.Messaging.FieldMessage = {
  pushMessage: function(message, selector, level){
    var id = new Date().getTime();
    if($(selector).offset() != null && $(selector).offset != 'undefined'){
      offLeft = $(selector).offset().left;      
      div = $('<div id="gyreFieldMessage'+id+'" class="'+level+'" style="white-space:pre-wrap;">'+message+'</div>');
      $(selector).parent().last().append(div);
      $(selector).parent().find('div#gyreFieldMessage'+id).offset({left: offLeft, top: $(selector).parent().find('div#gyreFieldMessage'+id).offset().top});           
    }   
  },

  clearAll: function(){    
    Gyre.$('div[id*="gyreFieldMessage"]').remove();
  }
};

/**
* @static
* @example
//Create a new spinner at the top of the #foo element
Gyre.Messaging.LoadingSpinner.startSpinner('#foo');
*/
Gyre.Messaging.LoadingSpinner = {

  spinner: null,

  /**
  * @memberOf Gyre.Messaging.LoadingSpinner#
  * @param {string} String name of the element where the spinner should go
  */
  startSpinner: function(id){
    if(this.spinner!=null){
      this.spinner.start();
      return;
    }
    
    this.spinner = new imageLoader(cImageSrc, 'startAnimation()');  
  },

  /**
  * @memberOf Gyre.Messaging.LoadingSpinner#
  */
  stopSpinner: function() {
    this.spinner.stopAnimation();
  }
};

/**
* @static
* @example
//Show a Modal for the user to re-login and kick them back to "/"
Gyre.Messaging.ReLoginModal();
*/
Gyre.Messaging.ReLoginModal = {
  show: function() {
    Gyre.Messaging.Modal.show('Error: Session Expired', 'Your session has expired.  Please re-login', [
      $('<button/>',{
        text: 'OK', 
        'class': 'btn btn-primary',
        click: function() {
          location.href="/";
          Gyre.Messaging.Modal.hide();
        }
      })        
    ]);
  }
};

/**
* @static
*/
Gyre.Messaging.Modal = {
  show: function(title, body, buttons){
    Gyre.$('.modal-title').text(title);
    Gyre.$('.modal-body').html(body);
    Gyre.$('.modal-footer').html(buttons);
    $('.modal').modal('show');
  },

  hide: function() {
    $('.modal').modal('hide');
  }
}

/**
* Gyre.Namespace - Used to create a custom namespace
* @namespace
*/
Gyre.Namespace = {
  /**
  * @memberOf Gyre.Namespace#
  * @returns {object}
  * @example var MyApp = Gyre.Namespace.createNS('MyApp');
  */
  createNS: function(name){
    var NS = {};
    return NS;
  }
};

/**
* Gyre.Utilities
* @namespace
* @memberOf Gyre
*/
Gyre.Utilities = {
  /**
  * @static
  * @memberOf Gyre.Utilities#
  * @returns {string}
  */
  getLastParameterFromPathhName: function(){
    var splitPathName = window.location.pathname.split('/');
    var lastValue = splitPathName[splitPathName.length-1];
    return lastValue;
  },

  /**
  * @static
  * @memberOf Gyre.Utilities#
  * @returns {string}
  * @example Gyre.Utilities.getParameterValueByName('q') //Returns 'foo' if location.search is '?q=foo'
  */
  getParameterValueByName : function(name){
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if(results == null)
      return "";
    else{
      results[1] = results[1].replace(/\+/g, " ");
      results[1] = results[1].replace(/\.json/g, "");
      return decodeURIComponent(results[1]);
    }              
  },

  /**
  * @static
  * @memberOf Gyre.Utilities#
  * @returns {string}
  */
  compareFormObjects: function(originalForms,modifiedForms){
    console.debug('Comparing ',originalForms,' and ',modifiedForms);
    var formsToSave=[];

    $.each(originalForms, function(index, obj){
      $.each(modifiedForms, function(index, modObj){      
        if(modObj.formId == obj.formId){
          var originalSerialized = $(obj.form).serialize();
          var modSerialized = $(modObj.form).serialize();

          if(originalSerialized != modSerialized){
            formsToSave.push(modObj);
          }
        }
      });
    });

    return formsToSave;
  },

  esc: function(str){    
    return str.replace(/([.])/g,'\\$1');
  }
};