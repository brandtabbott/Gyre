# Gyre
A lightweight JavaScript MVC framework & general utility library

## Example (AJAX):
#### Includes: (gyre.html)
    <!-- Jquery -->
    <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.0/jquery.min.js"></script>

    <!-- Handlebars -->
    <script src="http://cdnjs.cloudflare.com/ajax/libs/handlebars.js/1.3.0/handlebars.js"></script>

    <!-- Gyre -->
    <script src="gyre.js"></script>

#### JavaScript: (gyre.html)
    <script>
      Gyre.ENV={
        HANDLEBARS_TEMPLATE_URL:'/js/gyre/'
      }

      GitHubOwnerModel = Gyre.MVC.Model.extend({
        init: function() {
          this._super();
          this.name="GitHubOwnerModel"
        }
      });

      GitHubOwnerController = Gyre.MVC.Controller.extend({
        init: function() {
          this._super();
          this.name="GitHubOwnerController"
          this.template='gyreTest'
        },

        show: function() {
          var self = this;

          var model = new GitHubOwnerModel();
          model.loadModel('https://api.github.com/users/brandtabbott/repos');

          model.promise.then(function(){
            self.renderLoadedTemplate(model.content[0].owner);
          });
        }
      });

      var controller = new GitHubOwnerController();
      controller.show();   
    </script>

#### Page Body (gyre.html):
    <bpdy>
      <script id="gyreTest" type="text/x-handlebars-template"></script>
    </body>

#### Handlebars Template (gyreTest.hbs):
    <div class="container-fluid">
      <div>Gyre Test Handlebars Template</div>
      <div>id: {{id}}</div>
      <didv>login: {{login}}</div>
      <img src="{{avatar_url}}"/>
    </div>

##Example (WebSocket):
Same as above, except, JavaScript is a little different.
#### JavaScript: (gyre.html)
    <script>
      Gyre.ENV={
        HANDLEBARS_TEMPLATE_URL:'/js/gyre/'
      }

      GitHubOwnerModel = Gyre.MVC.Model.extend({
        init: function() {
          this._super();
          this.name="GitHubOwnerModel"
        }
      });

      GitHubOwnerController = Gyre.MVC.Controller.extend({
        init: function() {
          this._super();
          this.name="GitHubOwnerController"
          this.template='gyreTest'
        },

        show: function() {
          var self = this;

          var model = new GitHubOwnerModel();
          model.loadModelFromWebSocket('emitSomeEventHere', {optionsToYourServer: 'here'});

          //Use 'progress' instead of 'then' so that updates will load into the model (via Deferred.notify())
          model.promise.progress(function(){
            self.renderLoadedTemplate(model.content[0].owner);
          });
        }
      });

      var controller = new GitHubOwnerController();
      controller.show();   
    </script>

## Documentation
* [Online](https://github.com/brandtabbott/Gyre/raw/master/docs/index.html)

## Howto Generate HTML docs
In order to generate these documents, you will need: 

* [nodejs](http://nodejs.org/) 
* [jsdoc](https://www.npmjs.org/package/jsdoc) 

### Execute:
    jsdoc -d docs gyre.js -t docstrap-master/template -c docstrap-master/template/jsdoc.conf.json README.md
