const express = require("express");
const app = express();
var mongoose = require("mongoose");
const path = require("path");

//new code
const bodyParser = require('body-parser');

// support parsing of application/json type post data
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "assets")));

app.use(bodyParser.urlencoded({ extended: true }));



var exphbs = require("express-handlebars");
// app.set("view engine", "handlebars");
app.use(express.static(path.join(__dirname + "../views")));

app.set("view engine", "pug");

let connectionString =
  "mongodb+srv://admin:q80O6vnEyKBaR49o@cluster0.d67oq.mongodb.net/testdb";

mongoose
  .connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to database.");
  })
  .catch((err) => console.log(err));

const questionModel = mongoose.model(
    "Questions",
    new mongoose.Schema(
      {
        _id: mongoose.Schema.ObjectId,
        eng: String,
        rus: String,
        scale: Boolean,
        tags: Array,
        format: Object,
      },
      { collection: "questions" }
    ),
    "questions"
  );


app.post("/questions", async function (request, response) {
//console.log({body: request.body})
let _tags = "";
let _format = Object;
let _tf = ['No', 'Yes'];
let _tfRu = ['нет', 'да'];

let _en_tags_ = ["personal", "health", "financial", "social", "environment", "political", "emotional", "psychological", "generic", "freedom"];
let _ru_tags_ = ["Личное", "Здоровье", "Финансовое", "Социальное", "Экологическое", "Политическое", "Эмоциональное", "Психологическое"];


let _oF = ['Completely unhappy', 'Quite Unhappy', 'Neutral', 'Quite Happy', 'Very Happy'];
let _oFRu = ["Совершенно недоволен", "Довольно несчастный", "Нейтральный", "Довольно счастлив", "Очень счастлив"];
let _onine = [0,1,2,3,4,5,6,7,8];

//if(request.body.personal === "on") _tags.push("Personal");
//if(request.body.health === "on") _tags.push("Health");
//if(request.body.financial === "on") _tags.push("Financial");
//if(request.body.social === "on") _tags.push("Social");
//if(request.body.environmental === "on") _tags.push("Environmental");
//if(request.body.political === "on") _tags.push("Political");
//if(request.body.emotional === "on") _tags.push("Emotional");
//if(request.body.psychological === "on") _tags.push("Psychological");

if(request.body.tags === "1") _tags=_en_tags_[0];
if(request.body.tags === "2") _tags=_en_tags_[1];
if(request.body.tags === "3") _tags=_en_tags_[2];
if(request.body.tags === "4") _tags=_en_tags_[3];
if(request.body.tags === "5") _tags=_en_tags_[4];
if(request.body.tags === "6") _tags=_en_tags_[5];
if(request.body.tags === "7") _tags=_en_tags_[6];
if(request.body.tags === "8") _tags=_en_tags_[7];

if(request.body.tf === "1") _format={eng:_tf, rus: _tfRu};
if(request.body.tf === "2") _format={eng:_oF, rus: _oFRu};
if(request.body.tf === "3") _format={eng:_onine, rus: _onine};

var question = new questionModel({
     _id: mongoose.Types.ObjectId(),
     eng: request.body.enquestion,
     rus: request.body.ruquestion,
     tags: _tags,
     format: _format,
     });

let result = await question.save()
//console.log(result)
//await questionModel.save({
//    eng: request.body.questionInput,
//    rus: request.body.questionInput,
//    scale: true,
//    }
//)

})

app.get("/questions", async function (request, response) {

  //   let questions = await questionModel.find({});
  let questions = await questionModel
    .aggregate()
    .lookup({
      from: "answers",
      localField: "_id",
      foreignField: "questionId",
      as: "answers",
    })
    .sort({ createdAt: -1 });
  let happiness_Score = 0;
  let cumulativedays = [0,0,0,0,0,0,0];
  let cumulativehours = Array(24).fill(0);
  let cumulativeAgreements = Array(2).fill(0);

  let results = questions.map((question) => {
    let answers = question.answers;
    let agree = 0;
    let disagree = 0;
    let mean =0;
    let day = Array();
    let Hour = Array(24).fill(0);
    let hourlabels = Array.from(Array(24).keys());
    let midrange = 0;
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let _en_tags_ = ["personal", "health", "financial", "social", "environment", "political", "emotional", "psychological","generic", "freedom"];
    let _ru_tags_ = ["Личное", "Здоровье", "Финансовое", "Социальное", "Экологическое", "Политическое", "Эмоциональное", "Психологическое"];
    let _weights_tags_ = [0.83, 0.73, 0.63, 0.53, 0.53, 0.63, 0.73, 0.83, 0.5, 0.99];

    //Defining the weights

    let socailWeight = 0.83
    let workWeight = 0.43
    let enviromentalWeight = 0.63
    let incomeWeight = 0.73
    let healthWeight = 0.43
    let govtWeight = 0.33

//    let happinesIndex = socailWeight*meanQ1 + workWeight*meanQ2 + enviromentalWeight*meanQ3 + incomeWeight*meanQ4 + healthWeight*meanQ5 + govtWeight*meanQ6
    let happiness_weights = 0;
    let tagCounter = 0;
    var i=0;
    for (;i<question.tags.length;i++)
    {
        happiness_weights += _weights_tags_[_en_tags_.indexOf(question.tags[i].toLowerCase())];
        tagCounter += 1;
//        console.log(_weights_tags_[_en_tags_.indexOf(question.tags[i].toLowerCase())]);
    }

    happiness_weights /= tagCounter;

    let voteCount = {
      Sunday: 0,
      Monday: 0,
      Tuesday: 0,
      Wednesday: 0,
      Thursday: 0,
      Friday: 0,
      Saturday: 0,
    };
    let voteCountNum = [0,0,0,0,0,0,0];


    if (question.format.rus.length<4){
    midrange = 1;
    }
    else if(question.format.rus.length>3 && question.format.rus.length<7){
    midrange =3;
    }
    else{
    midrange =5;
    }

    answers.forEach((answer) => {
      if (answer.answer>= midrange){
        agree++;
        cumulativeAgreements[1]+=1
      }
      else{
        cumulativeAgreements[0]+=1
        disagree++;
      }
//      answer.answer < 3 ? agree++ : disagree++;
//      answer.answer === true ? agree++ : disagree++;
      let d = new Date(answer.time);
      day.push(days[d.getDay()]);
      voteCountNum[d.getDay()]+=1;
      cumulativedays[d.getDay()]+=1;
      voteCount[days[d.getDay()]]+=1;
      Hour[d.getHours()]+=1;
      cumulativehours[d.getHours()]+=1;
    });
    let total = agree+disagree;
    if (total>0)
    {
        mean = agree/(agree+disagree);
    }

    let happiness_Index = mean*happiness_weights;
//    console.log(question.tags)

    happiness_Score += happiness_Index

//    console.log(happiness_Score)


    return {
      rus: question.rus,
      tag: question.tags,
      agree,
      disagree,
      mean,
      day,
      Hour,
      hourlabels,
      voteCountNum,
      happiness_Index,
      happiness_Score,
      cumulativedays,
      days,
      cumulativehours,
      cumulativeAgreements,
    };
  });
  let len = results.length-1;
  console.log(results.length);
  response.render("questions", { results , len});
});


app.get("/answers", async function (request, response) {
  const answerModel = mongoose.model(
    "Answers",
    new mongoose.Schema(
      {
        _id: mongoose.Schema.ObjectId,
        chatId: String,
        questionId: mongoose.Schema.ObjectId,
        time: Number,
        answer: Boolean,
      },
      { collection: "answers" }
    ),
    "answers"
  );

  //   let answers = await answerModel.find({});
  let answers = await answerModel
    .aggregate()
    .lookup({
      from: "questions",
      localField: "questionId",
      foreignField: "_id",
      as: "questions",
    })
    .sort({ createdAt: -1 });

  let question = answers[0].questions[0].eng;

  response.render("answers", { answers, question });
  //   response.send({ answers });
});

app.get("/users", async function (request, response) {
  const userMode = mongoose.model(
    "Users",
    new mongoose.Schema(
      {
        _id: mongoose.Schema.ObjectId,
        firstName: String,
        lastName: String,
        userName: String,
        answered: [],
        lastSession: Date,
        sessionOn: Boolean,
        lastPicked: mongoose.Schema.ObjectId,
      },
      { collection: "users" }
    ),
    "users"
  );

  let users = await userMode.find({});

  response.status(200).json({ users });
});

app.get("/users/:userId", async function (request, response) {
  const userMode = mongoose.model(
    "Users",
    new mongoose.Schema(
      {
        _id: Number,
        firstName: String,
        lastName: String,
        userName: String,
        answered: [],
        lastSession: Date,
        sessionOn: Boolean,
        lastPicked: mongoose.Schema.ObjectId,
      },
      { collection: "users" }
    ),
    "users"
  );

  let userId = parseInt(request.params.userId);

  console.log({ userId });

  let user = await userMode.findOne({ _id: userId });

  response.status(200).json({ user });
});

app.listen(8080, function () {
  console.log("listening on 8080");
//  console.log(time);
});
