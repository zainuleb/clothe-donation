const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const stripe = require('stripe')(
  'sk_test_51Kb525DzIyjZnBzqHNx46ymjqPlIseguOQmR9uZY8MiRgwLLwxzYcNNQNYQHDIFk4kLpdOE03Jmp7oyE1JpvyWdr00qQffVXTx'
); // Add your Secret Key Here

//Required package for Mailing System
const nodemailer = require('nodemailer');
const pdf = require('pdf-creator-node');
const fs = require('fs');

const app = express();

// This will make our form data much more useful
app.use(bodyParser.urlencoded({ extended: true }));

// This will set express to render our views folder, then to render the files as normal html
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, './views')));

const mailingConfirmation = async (data) => {
  console.log(data);
  const options = {
    format: 'A3',
    orientation: 'portrait',
    border: '10mm',
    header: {
      height: '25mm',
      contents:
        '<div style="text-align: center; font-size:50px; margin-top:50px "><h1>Clothe Donation</h1></div>',
    },
    footer: {
      height: '12mm',
      contents: {
        first: 'Cover page',
        2: 'Second page', // Any page number is working. 1-based index
        default: '<span style="color: #444;">All Rights Reserved</span>', // fallback value
        last: 'Last Page',
      },
    },
  };

  const user = [
    {
      name: data.name,
      email: data.email,
      amount: data.amount,
      stripeToken: data.stripeToken,
    },
  ];

  var html = fs.readFileSync('mailingTemplate.html', 'utf8');
  var document = {
    html: html,
    data: {
      user: user,
    },
    path: `./${data.email}.pdf`,
    type: '',
  };

  var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'yourEmail',
      pass: 'yourpassword',
    },
  });

  var mailOptions = {
    from: 'yourEmail',
    to: data.email,
    subject: 'Donation Confirmation Email',
    text: 'Find Your Recipt below',
    attachments: [
      {
        filename: `${data.email}.pdf`,
        path: `C:/Users/Eb/Desktop/fiverCode/${data.email}.pdf`,
        contentType: 'application/pdf',
      },
    ],
  };

  await pdf
    .create(document, options)
    .then((res) => {
      setTimeout(() => {}, 2000);
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });
};

app.post('/charge', (req, res) => {
  try {
    stripe.customers
      .create({
        name: req.body.name,
        email: req.body.email,
        source: req.body.stripeToken,
      })
      .then((customer) =>
        stripe.charges.create({
          amount: req.body.amount * 100,
          currency: 'usd',
          customer: customer.id,
        })
      )
      .then(async () => {
        mailingConfirmation(req.body);
        res.render('completed.html');
      })
      .catch((err) => console.log(err));
  } catch (err) {
    res.send(err);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server is running...'));
