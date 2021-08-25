const router = require('express').Router();
const Register = require('../models/models');
const auth = require("../middleware/auth");


router.route('/').get((req, res) => {
    res.render("register.pug")
  });


router.route('/').post( async (req, res) => {
    try {
      console.log(req.body)
      email=req.body.email;
      name=req.body.name;
      phone=req.body.phone;
      if (req.body.password === req.body.confirmPassword) {
        var myData = new Register(req.body);
        console.log(myData)
  
        const token = await myData.generateAuthToken();
  
        // res.cookie("jwt", token, {
        //   expires: new Date(Date.now() + 30000),
        //   httpOnly: true
        // })
  
        await myData.save()
        res.status(201).redirect("/");
      }
      else {
        var err = "Passwords donot match";
        res.status(200).render("register.pug", { 'err': err, 'email':email,'name':name,'phone':phone});
        // res.send("Passwords Donot Match");
      }
    } catch (error) {
        var email=req.body.email;
        var name=req.body.name;
        var phone=req.body.phone;
        res.status(200).render("register.pug", { 'err': "Cannot Register Try Again", 'email':email,'name':name,'phone':phone});
      // res.status(400).send("unable to save to database");
    }
  })
  

  module.exports = router;

