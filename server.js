const express = require('express');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');

//Instantiate express app
const app = express();

//Body Parser middleware setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//connect to mongoose
mongoose.Promise = global.Promise;

mongoose
  .connect(
    'mongodb://ashish:db1234@ds133353.mlab.com:33353/ideajot',
    { useNewUrlParser: true }
  )
  .then(() => {
    console.log('mongoDB connected');
  })
  .catch(err => {
    console.log('trouble connecting mongoDB');
  });

//Load Mongoose model
require('./models/Idea');
const Idea = mongoose.model('idea');

// Handlebars Middleware
app.engine(
  'handlebars',
  exphbs({
    defaultLayout: 'main',
  })
);
app.set('view engine', 'handlebars');

//Method overRide middleware
app.use(methodOverride('_method'));

// Express Session middleware

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}))
app.use(flash());

app.use(function(req, res, next){
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
})

// Index Route
app.get('/', (req, res) => {
  const title = 'Welcome';
  res.render('home', {
    title: title,
  });
});

// About Route
app.get('/about', (req, res) => {
  res.render('about');
});

//Process Form
app.post('/ideas', (req, res) => {
  let errors = [];
  if (!req.body.title) {
    errors.push({ text: 'Please add a title' });
  }
  if (!req.body.description) {
    errors.push({ text: 'Please add some description' });
  }
  if (errors.length > 0) {
    res.render('ideas/add', {
      errors: errors,
      title: req.body.title,
      description: req.body.description,
    });
  } else {
    const newIdea = {
      title: req.body.title,
      description: req.body.description,
    };
    new Idea(newIdea)
      .save()
      .then(idea => {
        req.flash('success_msg', 'Idea added successfully')
        res.redirect('/ideas');
      })
      .catch(err => {
        console.log({ msg: err });
      });
  }
});

//Show ideas Route
app.get('/ideas', (req, res) => {
  Idea.find({})
    .sort({ date: 'desc' })
    .then(ideas => {
      res.render('ideas/index', {
        ideas: ideas,
      });
    })
    .catch(err => {
      console.log({ msg: err });
    });
});

//Add Idea Route
app.get('/ideas/add', (req, res) => {
  res.render('ideas/add');
});

//Edit Idea
app.get('/ideas/edit/:id', (req, res) => {
  Idea.findOne({
    _id: req.params.id,
  })
    .then(idea => {
      res.render('ideas/edit', {
        idea: idea,
      });
    })
    .catch(err => {
      console.log({
        msg: err,
      });
    });
});

//Edit form process
app.put('/ideas/:id', (req, res) => {
  Idea.findOne({ id: req.body.id })
    .then(idea => {
      //mutate with new values
      idea.title = req.body.title;
      idea.description = req.body.description;

      idea
        .save()
        .then(idea => {
          req.flash('success_msg', 'Idea edited successfully')
          res.redirect('/ideas');
        })
        .catch(err => {
          console.log({ msg: err });
        });
    })
    .catch(err => {
      console.log('can not find by id...');
    });
});

//Delete idea request
app.delete('/ideas/:id', (req, res) => {
  Idea.remove({
    _id: req.params.id,
  }).then(() => {
    req.flash('success_msg', 'Idea deleted successfully')
    res.redirect('/ideas');
  });
  // res.send('deleted');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
