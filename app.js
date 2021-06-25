var express = require('express');
var path = require('path');
var pug = require('pug');
var bodyParser = require('body-parser');

var flash = require('connect-flash');
var session = require('express-session');
var passport = require('passport');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/nodekb', {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  
  console.log('Ok!!!');
});

var app = express();
const PORT = process.env.PORT||3000;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())
var Article=require('./models/article.js');
var User=require('./models/user.js');

app.set('views',path.join(__dirname,'views'));
app.set('view engine','pug');
app.use(express.static(path.join(__dirname,'public')));
app.use('/bootstrap',express.static(__dirname + '/node_modules/bootstrap/dist/css/'));
app.use('/bootstrapjq',express.static(__dirname + '/node_modules/jquery/dist/'));
app.use('/bootstrapj',express.static(__dirname + '/node_modules/bootstrap/dist/js/'));
//session-middleware
app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true,
}));
//messages-middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});


require('./config/passport.js')(passport);
app.use(passport.initialize());
app.use(passport.session());


app.get('*',(req,res,next)=>{
	res.locals.user = req.user || null;
	next();
});
//Home
app.get('/',(req,res)=>{

	Article.find(function (err,articles) {
  		if(err) 
  			return console.error(err);
  		else{
  			res.render('index',{
			title:"Home",
			articles:articles
			});
  		}
	});

});
//List of authors

app.get('/authors',ensureAuthenticated,(req,res)=>{
	Article.find((err,articles)=>{
		if(err)
			return console.log(err);
		else
		{
			res.render('authors',{
				title:"Authors",
				articles:articles
			});
		}
	});
});
// view the specific article
app.get('/article/:id',(req,res)=>{
	Article.findById(req.params.id,(err,article)=>{
		res.render('article',{
			article:article, 
		});
	})
})

//adding a article 
app.post('/articles/add',(req,res)=>{
	var newarticle = new Article();
	newarticle.title=req.body.title;
	newarticle.author=req.user._id;
	newarticle.body=req.body.body;
	newarticle.save(function (err) {
    	if(err){
    		return console.error(err);
    	}
    	else{
    		req.flash('success','Article Added');
    		res.redirect('/');	
    	}
  	});
  	
});
// page to add article
app.get('/articles/add',ensureAuthenticated,(req,res)=>{
	res.render('add',{
		title:"About"
	});
});
//edit page
app.get('/article/edit/:id',ensureAuthenticated,(req,res)=>{
	Article.findById(req.params.id,(err,article)=>{

		if(article.author!=req.user._id)
		{
			req.flash('danger','Not allowed to edit those articles');
			res.redirect('/');
		}else{
			res.render('edit_article',{
				title:"Edit Article",
				article:article
			});
		}
	});
});
// editted on submit
app.post('/article/edit/:id', (req, res) => {
  const arti = new Article({
    _id: req.params.id,
    title: req.body.title,
    author: req.body.author,
    body: req.body.body
  });
  Article.updateOne({_id: req.params.id},arti).then(
    () => {
      req.flash('success','Article Updated');
      res.redirect('/');
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
});

app.delete('/articles/:id', (req, res, next) => {
  Article.deleteOne({_id: req.params.id}).then(
    () => {
      res.send('done');
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
});

//Register Page
app.get('/register',(req,res)=>{
	res.render('register');
})

app.post('/register',(req,res)=>{
	var newuser = new User();
	newuser.name=req.body.name;
	newuser.email=req.body.email;
	newuser.username=req.body.username;
	newuser.password=req.body.password;
	newuser.save(function (err) {
    	if(err){
    		return console.error(err);
    	}
    	else{
    		req.flash('success','Registered Successfully Login Now!');
    		res.redirect('/login');	
    	}
  	});
});

app.get('/login',(req,res)=>{
	res.render('login');
})

app.post('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login',
                                   failureFlash:true
                   				 })
);
app.get('/logout',(req,res)=>{
	req.logout();
	req.flash('success','See you Soon :-)');
	res.redirect('/');
});

// giving controls
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    req.flash('danger', 'Login to access this page!');
    res.redirect('/login');
  }
}
app.listen(PORT,()=>(console.log('UP')));