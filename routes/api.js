/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var mongoose    = require('mongoose');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.MONGO_URI; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  
  mongoose.connect(CONNECTION_STRING);
  var Schema = mongoose.Schema;
  var issueSchema = new Schema({
    project: {type: String},
    issue_title: {type: String, required: true},
    issue_text: {type: String, required: true},
    created_by: {type: String, required: true},
    assigned_to: String,
    created_on: Date,
    updated_on: Date,
    open: {type: Boolean, default: true},
    status_text: String
  });
  var Issue = mongoose.model('Issue', issueSchema);
  
  app.route('/api/issues/:project')
  
    .get(function (req, res){
      var project = req.params.project;
      var queries = req.query;
      let validQueryKeys = ['issue_title', 'issue_text', 'created_by', 'assigned_to', 'open', 'status_text'];
      let validInputs = {};
    
      //Check that a project name and optionally if any queries were entered
      if(project) {
        //Set user inputed project name
        validInputs['project'] = project;
        if(queries) {
          //Check that user entered valid query keys
          for(let query in queries) {
            for(let i = 0; i < validQueryKeys.length; i++) {
              let thisKey = query;
              let thisValue = queries[query];
              if(validQueryKeys[i] == thisKey) {
                validInputs[thisKey] = thisValue;
              }
            }
          }
          //Query database for matching documents
          Issue.find(validInputs, (err, doc) => {
            if(err) {
              console.log('Database Error: ' + err);
            }
            let result = [];
            //Organize all returned document fields
            doc.forEach((item) => {
              result.push({_id: item._id, issue_title: item.issue_title, issue_text: item.issue_text, created_by: item.created_by,
                          assigned_to: item.assigned_to, created_on: item.created_on, updated_on: item.updated_on, open: item.open,
                          status_text: item.status_text});
            })
            //Render result
            res.json(result);
          });
        }
      }
    })

    .post(function (req, res){
      var project = req.params.project;
      
      //Create model instance
      var issue = new Issue({
        project: project,
        issue_title: req.body.issue_title,
        issue_text: req.body.issue_text,
        created_by: req.body.created_by,
        assigned_to: req.body.assigned_to || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true,
        status_text: req.body.status_text || ''
      });
      
      //Check that use has entered a project name
      if(project) {
        if(issue.issue_title.length == 0 || issue.issue_text.length == 0 || issue.created_by.length == 0) {
          console.log('Missing inputs');
          res.send('Missing inputs');
        }
        else {
          //Save the document
          issue.save((err, doc) => {
            if (err) {
              console.log('Database connection error: ' + err);
            }
            res.json({_id: doc._id, issue_title: doc.issue_title, issue_text: doc.issue_text, created_by: doc.created_by,
                      assigned_to: doc.assigned_to, created_on: doc.created_on, updated_on: doc.updated_on, open: doc.open,
                      status_text: doc.status_text})
          });
        }

      }
      //Send error message
      else {
        res.send('Please enter: https://scarce-seed.glitch.me/{project name}');
      }
    })

    .put(function (req, res){
      var project = req.params.project;
      var issueID = req.body._id;
      delete req.body._id;
      var updates = req.body;
      
      //Delete any keys that weren't updated
      for(let update in updates) {
        if(!updates[update]) {
          delete updates[update];
        }
      }
      //Check that the user updated at least one field
      if(Object.keys(updates).length === 0) {
        res.send('no updated field sent');
      }
      else {
        //Update the updated_on date to the current date
        updates.updated_on = new Date();
        
        //Update all fields entered to the document
        Issue.findByIdAndUpdate(issueID, updates, (err, doc) => {
          if(err) {
            res.send('Could not update ' + issueID + ': ' + err);
          }
          else {
            res.send('Successfully updated');
          }
        });
      }
  })

    .delete(function (req, res){
      var project = req.params.project;
      var issueID = req.body._id;
      if(!issueID) {
        res.send('_id error');
      }
      else {
        Issue.findByIdAndRemove(issueID, (err, doc) => {
          if(err) {
            res.send('Could not delete ' + issueID + ': ' + err);
          }
          else {
            res.send('Deleted ' + issueID);
          }
        });
      }
    });
  
};
